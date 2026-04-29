"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ActionState } from "@/lib/type";
import { sendbase64toS3DataVdo } from "@/lib/actions/actionIndex";
import { transcribeVideoAudio } from "@/lib/ai/geminiAI";
import { videoConversionService } from "@/lib/services/videoConversionService";
import { videoThumbnailService } from "@/lib/services/videoThumbnailService";
import fs from "fs/promises";
import os from "os";
import path from "path";

/* ====================================================== */
/* HELPER: Extract video duration (seconds) via ffprobe    */
/* ====================================================== */

async function getVideoDuration(buffer: Buffer, ext: string): Promise<number | null> {
  let tempPath: string | null = null;
  try {
    tempPath = path.join(os.tmpdir(), `story_probe_${Date.now()}.${ext}`);
    await fs.writeFile(tempPath, buffer);

    const metadata = await videoConversionService.getVideoMetadata(tempPath);
    const duration = metadata?.format?.duration;
    return duration ? Math.round(Number(duration)) : null;
  } catch (error) {
    console.warn("getVideoDuration failed:", error);
    return null;
  } finally {
    if (tempPath) {
      await fs.unlink(tempPath).catch(() => {});
    }
  }
}

/* ====================================================== */
/* CREATE STORY                                            */
/* ====================================================== */

export async function createStory(
  formData: FormData,
  projectId: number,
  organizationId: number,
  caption?: string,
): Promise<ActionState> {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id) : 0;
    if (!userId) return { success: false, error: true, message: "ไม่พบผู้ใช้" };

    // 1. Validate file
    let file = formData.get("file") as File | null;
    if (!file) return { success: false, error: true, message: "ไม่พบไฟล์วิดีโอ" };

    const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
    if (file.size > MAX_SIZE) {
      return { success: false, error: true, message: "ไฟล์วิดีโอต้องไม่เกิน 100 MB" };
    }
    if (!file.type.startsWith("video/")) {
      return { success: false, error: true, message: "อนุญาตเฉพาะไฟล์วิดีโอเท่านั้น" };
    }

    // 2. Convert MOV → MP4 if needed (also compresses via libx264 crf 23)
    const isMovFile = file.name.toLowerCase().endsWith(".mov") ||
      file.type === "video/quicktime";
    if (isMovFile) {
      try {
        console.log(`🎬 Converting MOV → MP4: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
        file = await videoConversionService.convertMovToMp4(file);
        console.log(`✅ Converted: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
      } catch (error) {
        console.error("MOV conversion failed, uploading original:", error);
        // Fall through — upload original file if conversion fails
      }
    }

    // 3. Read file buffer once (reused for duration + upload)
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split(".").pop() || "mp4";

    // 4. Extract video duration + enforce max 60 seconds
    const duration = await getVideoDuration(fileBuffer, fileExt);
    const MAX_DURATION_SEC = 60;
    if (duration && duration > MAX_DURATION_SEC) {
      return {
        success: false,
        error: true,
        message: `วิดีโอต้องไม่ยาวเกิน ${MAX_DURATION_SEC} วินาที (วิดีโอนี้ยาว ${duration} วินาที)`,
      };
    }

    // 5. Upload video to S3
    const uploadFile = new File([fileBuffer], file.name, { type: file.type });
    const uploadFormData = new FormData();
    uploadFormData.append("file", uploadFile);
    const uploadResult = await sendbase64toS3DataVdo(uploadFormData, "stories");
    if (!uploadResult.success || !uploadResult.url) {
      return { success: false, error: true, message: "อัปโหลดวิดีโอไม่สำเร็จ" };
    }

    // 6. Create story record (optimistic — show immediately)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24hr

    const story = await prisma.story.create({
      data: {
        videoUrl: uploadResult.url,
        caption: caption || null,
        duration,
        isProcessing: true,
        expiresAt,
        organizationId,
        projectId,
        userId,
      },
    });

    // 6. Trigger thumbnail + AI transcript in background (non-blocking)
    processStoryInBackground(story.id, uploadResult.url);

    return {
      success: true,
      error: false,
      message: "สร้างสตอรี่สำเร็จ",
      data: {
        id: story.id,
        videoUrl: story.videoUrl,
        thumbnailUrl: story.thumbnailUrl,
        caption: story.caption,
        transcript: story.transcript,
        duration: story.duration,
        isProcessing: story.isProcessing,
        expiresAt: story.expiresAt.toISOString(),
        createdAt: story.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Create Story Error:", error);
    return { success: false, error: true, message: "สร้างสตอรี่ไม่สำเร็จ" };
  }
}

/* ====================================================== */
/* BACKGROUND: THUMBNAIL + AI TRANSCRIPT (parallel)        */
/* ====================================================== */

async function processStoryInBackground(storyId: number, videoUrl: string) {
  // Download video once — reuse for thumbnail (avoids double download)
  let videoFile: File | null = null;
  try {
    const res = await fetch(videoUrl);
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "video/mp4";
    videoFile = new File([buf], `story_${storyId}.mp4`, { type: contentType });
  } catch (error) {
    console.warn(`⚠️ Story #${storyId} video download failed:`, error);
  }

  const [thumbnailResult, transcriptResult] = await Promise.allSettled([
    videoFile ? generateThumbnail(storyId, videoFile) : Promise.resolve(),
    generateTranscript(storyId, videoUrl),
  ]);

  if (thumbnailResult.status === "rejected") {
    console.error(`❌ Story #${storyId} thumbnail error:`, thumbnailResult.reason);
  }
  if (transcriptResult.status === "rejected") {
    console.error(`❌ Story #${storyId} transcript error:`, transcriptResult.reason);
  }

  // Mark processing as done regardless of individual results
  await prisma.story.update({
    where: { id: storyId },
    data: { isProcessing: false },
  }).catch(() => {});
}

/* ── Thumbnail generation (from File, no re-download) ── */

async function generateThumbnail(storyId: number, videoFile: File) {
  try {
    const thumbnailUrl = await videoThumbnailService.generateAndUploadThumbnail(
      videoFile,
      1, // capture frame at 1 second
    );

    await prisma.story.update({
      where: { id: storyId },
      data: { thumbnailUrl },
    });
    console.log(`🖼️ Story #${storyId} thumbnail generated`);
  } catch (error) {
    console.warn(`⚠️ Story #${storyId} thumbnail failed:`, error);
  }
}

/* ── AI transcript generation (uses URL — Gemini needs to ingest video) ── */

async function generateTranscript(storyId: number, videoUrl: string) {
  try {
    const result = await transcribeVideoAudio(videoUrl);

    if (result) {
      // Only auto-fill caption if user didn't provide one
      const existing = await prisma.story.findUnique({
        where: { id: storyId },
        select: { caption: true },
      });

      await prisma.story.update({
        where: { id: storyId },
        data: {
          transcript: result.transcript,
          caption: existing?.caption ? undefined : (result.summary || undefined),
        },
      });
      console.log(`✅ Story #${storyId} transcript completed`);
    } else {
      console.warn(`⚠️ Story #${storyId} transcript returned null`);
    }
  } catch (error) {
    console.error(`❌ Story #${storyId} transcript error:`, error);
  }
}

/* ====================================================== */
/* GET ACTIVE STORIES (not expired, grouped by user)       */
/* ====================================================== */

export async function getActiveStories(
  projectId: number,
  organizationId: number,
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id ? parseInt(session.user.id) : 0;

    const now = new Date();

    const stories = await prisma.story.findMany({
      where: {
        projectId,
        organizationId,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        views: {
          where: { userId: currentUserId },
          select: { id: true },
        },
      },
    });

    // Format and group by user
    const userMap = new Map<number, {
      user: { id: number; displayName: string | null; avatarUrl: string | null };
      stories: any[];
      hasUnviewed: boolean;
    }>();

    for (const story of stories) {
      const isViewed = story.views.length > 0;
      const formatted = {
        id: story.id,
        videoUrl: story.videoUrl,
        thumbnailUrl: story.thumbnailUrl,
        caption: story.caption,
        transcript: story.transcript,
        duration: story.duration,
        isProcessing: story.isProcessing,
        expiresAt: story.expiresAt.toISOString(),
        createdAt: story.createdAt.toISOString(),
        user: story.user,
        isViewed,
      };

      if (!userMap.has(story.userId)) {
        userMap.set(story.userId, {
          user: story.user,
          stories: [],
          hasUnviewed: false,
        });
      }

      const group = userMap.get(story.userId)!;
      group.stories.push(formatted);
      if (!isViewed) group.hasUnviewed = true;
    }

    // Current user's stories first, then others
    const groups = Array.from(userMap.values());
    groups.sort((a, b) => {
      if (a.user.id === currentUserId) return -1;
      if (b.user.id === currentUserId) return 1;
      // Unviewed first
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });

    return { success: true, data: groups };
  } catch (error) {
    console.error("Get Active Stories Error:", error);
    return { success: false, data: [] };
  }
}

/* ====================================================== */
/* MARK STORY AS VIEWED                                    */
/* ====================================================== */

export async function markStoryViewed(storyId: number): Promise<ActionState> {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id) : 0;
    if (!userId) return { success: false, error: true, message: "ไม่พบผู้ใช้" };

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { organizationId: true },
    });
    if (!story) return { success: false, error: true, message: "ไม่พบสตอรี่" };

    await prisma.story_view.upsert({
      where: { storyId_userId: { storyId, userId } },
      create: {
        storyId,
        userId,
        organizationId: story.organizationId,
      },
      update: { viewedAt: new Date() },
    });

    return { success: true, error: false };
  } catch (error) {
    console.error("Mark Story Viewed Error:", error);
    return { success: false, error: true, message: "บันทึกการดูไม่สำเร็จ" };
  }
}
