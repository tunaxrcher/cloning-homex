"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ActionState } from "@/lib/type";

/* ====================================================== */
/* INTERNAL: CREATE FEED POST (called from task actions)  */
/* ====================================================== */

export async function createFeedPost(params: {
  feedType: string;
  content: string;
  organizationId: number;
  projectId: number;
  userId: number;
  taskId?: number;
  subtaskId?: number;
  imageUrl?: string;
}) {
  try {
    await prisma.feed_post.create({
      data: {
        feedType: params.feedType,
        content: params.content,
        imageUrl: params.imageUrl ?? null,
        organizationId: params.organizationId,
        projectId: params.projectId,
        userId: params.userId,
        taskId: params.taskId ?? null,
        subtaskId: params.subtaskId ?? null,
      },
    });
  } catch (error) {
    console.error("Create Feed Post Error:", error);
  }
}

/* ====================================================== */
/* GET FEED POSTS                                         */
/* ====================================================== */

export async function getFeedPosts(
  projectId: number,
  organizationId: number,
  cursor?: number,
  take: number = 10,
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id ? parseInt(session.user.id) : 0;

    const posts = await prisma.feed_post.findMany({
      where: { projectId, organizationId },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        task: {
          select: { id: true, taskName: true },
        },
        subtask: {
          select: { id: true, detailName: true },
        },
        _count: {
          select: { likes: true, comments: true, shares: true },
        },
        likes: {
          where: { userId: currentUserId },
          select: { id: true },
        },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: "desc" },
          take: 2,
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
            _count: { select: { likes: true } },
            likes: {
              where: { userId: currentUserId },
              select: { id: true },
            },
            replies: {
              take: 0,
            },
          },
        },
      },
    });

    const hasMore = posts.length > take;
    const sliced = hasMore ? posts.slice(0, take) : posts;

    const formatted = sliced.map((post: any) => ({
      id: post.id,
      feedType: post.feedType,
      content: post.content,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt.toISOString(),
      user: post.user,
      task: post.task,
      subtask: post.subtask,
      _count: post._count,
      isLiked: post.likes.length > 0,
      previewComments: post.comments.map((c: any) => ({
        id: c.id,
        content: c.content,
        imageUrl: c.imageUrl,
        createdAt: c.createdAt.toISOString(),
        user: c.user,
        parentId: c.parentId,
        replies: [],
        _count: c._count,
        isLiked: c.likes.length > 0,
      })),
    }));

    return {
      success: true,
      data: formatted,
      hasMore,
      nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
    };
  } catch (error) {
    console.error("Get Feed Posts Error:", error);
    return { success: false, data: [], hasMore: false, nextCursor: null };
  }
}

/* ====================================================== */
/* TOGGLE LIKE POST                                       */
/* ====================================================== */

export async function toggleLikePost(feedPostId: number): Promise<ActionState> {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id) : 0;
    if (!userId) return { success: false, error: true, message: "ไม่พบผู้ใช้" };

    const existing = await prisma.feed_like.findUnique({
      where: { feedPostId_userId: { feedPostId, userId } },
    });

    if (existing) {
      await prisma.feed_like.delete({ where: { id: existing.id } });
    } else {
      await prisma.feed_like.create({ data: { feedPostId, userId } });
    }

    return { success: true, error: false };
  } catch (error) {
    console.error("Toggle Like Error:", error);
    return { success: false, error: true, message: "ไม่สามารถกดไลค์ได้" };
  }
}

/* ====================================================== */
/* CREATE COMMENT                                         */
/* ====================================================== */

export async function createComment(
  feedPostId: number,
  content: string,
  parentId?: number,
  imageUrl?: string,
): Promise<ActionState & { data?: any }> {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id) : 0;
    if (!userId) return { success: false, error: true, message: "ไม่พบผู้ใช้" };

    if (!content.trim() && !imageUrl) {
      return { success: false, error: true, message: "กรุณากรอกความคิดเห็น" };
    }

    const comment = await prisma.feed_comment.create({
      data: {
        feedPostId,
        userId,
        content: content.trim() || "",
        imageUrl: imageUrl ?? null,
        parentId: parentId ?? null,
      },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { likes: true } },
      },
    });

    return {
      success: true,
      error: false,
      data: {
        id: comment.id,
        content: comment.content,
        imageUrl: comment.imageUrl,
        createdAt: comment.createdAt.toISOString(),
        user: comment.user,
        parentId: comment.parentId,
        replies: [],
        _count: comment._count,
        isLiked: false,
      },
    };
  } catch (error) {
    console.error("Create Comment Error:", error);
    return { success: false, error: true, message: "ไม่สามารถแสดงความคิดเห็นได้" };
  }
}

/* ====================================================== */
/* GET ALL COMMENTS FOR A POST                            */
/* ====================================================== */

export async function getCommentsByPost(feedPostId: number) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id ? parseInt(session.user.id) : 0;

    // Fetch ALL comments for this post (flat)
    const allComments = await prisma.feed_comment.findMany({
      where: { feedPostId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { likes: true } },
        likes: {
          where: { userId: currentUserId },
          select: { id: true },
        },
      },
    });

    // Map to flat list
    const flat = allComments.map((c: any) => ({
      id: c.id,
      content: c.content,
      imageUrl: c.imageUrl,
      createdAt: c.createdAt.toISOString(),
      user: c.user,
      parentId: c.parentId,
      _count: c._count,
      isLiked: c.likes.length > 0,
      replies: [] as any[],
    }));

    // Build tree recursively
    const map = new Map<number, typeof flat[0]>();
    flat.forEach((c: any) => map.set(c.id, c));

    const roots: typeof flat = [];
    flat.forEach((c: any) => {
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.replies.push(c);
      } else {
        roots.push(c);
      }
    });

    return { success: true, data: roots };
  } catch (error) {
    console.error("Get Comments Error:", error);
    return { success: false, data: [] };
  }
}

/* ====================================================== */
/* TOGGLE LIKE COMMENT                                    */
/* ====================================================== */

export async function toggleLikeComment(
  feedCommentId: number,
): Promise<ActionState> {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id) : 0;
    if (!userId) return { success: false, error: true, message: "ไม่พบผู้ใช้" };

    const existing = await prisma.feed_comment_like.findUnique({
      where: { feedCommentId_userId: { feedCommentId, userId } },
    });

    if (existing) {
      await prisma.feed_comment_like.delete({ where: { id: existing.id } });
    } else {
      await prisma.feed_comment_like.create({ data: { feedCommentId, userId } });
    }

    return { success: true, error: false };
  } catch (error) {
    console.error("Toggle Comment Like Error:", error);
    return { success: false, error: true, message: "ไม่สามารถกดไลค์ได้" };
  }
}

/* ====================================================== */
/* SHARE POST                                             */
/* ====================================================== */

export async function sharePost(feedPostId: number): Promise<ActionState> {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id) : 0;
    if (!userId) return { success: false, error: true, message: "ไม่พบผู้ใช้" };

    await prisma.feed_share.create({ data: { feedPostId, userId } });

    return { success: true, error: false };
  } catch (error) {
    console.error("Share Post Error:", error);
    return { success: false, error: true, message: "ไม่สามารถแชร์ได้" };
  }
}

export async function deleteSubtaskFeed(params: {
  subtaskId: number;
}) {
  try {
    await prisma.feed_post.deleteMany({
      where: {
        subtaskId: params.subtaskId,
        feedType: "SUBTASK_COMPLETED",
      },
    });
  } catch (error) {
    console.error("Delete Feed Post Error:", error);
  }
}