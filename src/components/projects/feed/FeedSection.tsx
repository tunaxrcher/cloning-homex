"use client";

import { useState, useEffect, useCallback, useRef, startTransition } from "react";
import { Spinner } from "@heroui/react";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { AnimatePresence } from "framer-motion";
import type { FeedSectionProps, FeedPostData, StoryGroup, CreateStoryResponse } from "@/lib/type";
import FeedCard from "./FeedCard";
import StoryBar from "./StoryBar";
import StoryFAB from "./StoryFAB";
import StoryVideoPreview from "./StoryVideoPreview";
import StoryViewer from "./StoryViewer";
import {
  getFeedPosts,
  toggleLikePost,
  createComment,
  sharePost,
  getCommentsByPost,
  toggleLikeComment,
} from "@/lib/actions/actionFeed";
import {
  getActiveStories,
  createStory,
  markStoryViewed,
} from "@/lib/actions/actionStory";
import { captureVideoThumbnail } from "@/lib/captureVideoThumbnail";

export default function FeedSection({
  projectId,
  organizationId,
  currentUserId,
}: FeedSectionProps) {
  const session = useSession();
  const currentUserAvatar = session.data?.user?.avatarUrl ?? null;
  const currentUserName = session.data?.user?.displayName ?? null;

  // Feed state
  const [posts, setPosts] = useState<FeedPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Story state
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerGroupIndex, setViewerGroupIndex] = useState(0);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const recordInputRef = useRef<HTMLInputElement>(null);

  // ─── Story Logic ───
  const loadStories = useCallback(async () => {
    setStoriesLoading(true);
    try {
      const res = await getActiveStories(projectId, organizationId);
      if (res.success) {
        setStoryGroups(res.data as StoryGroup[]);
      }
    } catch {
      console.error("Failed to load stories");
    } finally {
      setStoriesLoading(false);
    }
  }, [projectId, organizationId]);

  useEffect(() => {
    if (projectId && organizationId) loadStories();
  }, [projectId, organizationId, loadStories]);

  const handleUploadVideo = () => {
    uploadInputRef.current?.click();
  };

  const handleRecordVideo = () => {
    recordInputRef.current?.click();
  };

  const MAX_VIDEO_SIZE_MB = 100;
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("กรุณาเลือกไฟล์วิดีโอ");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      toast.error(`ไฟล์วิดีโอต้องไม่เกิน ${MAX_VIDEO_SIZE_MB} MB`);
      return;
    }
    setSelectedVideoFile(file);
    setShowVideoPreview(true);
    // Reset input
    e.target.value = "";
  };

  const handleUploadStory = async (caption: string) => {
    if (!selectedVideoFile) return;
    setIsUploading(true);
    try {
      // Capture client-side thumbnail while uploading
      const [thumbnailDataUrl, res] = await Promise.all([
        captureVideoThumbnail(selectedVideoFile),
        (async () => {
          const fd = new FormData();
          fd.append("file", selectedVideoFile);
          return createStory(fd, projectId, organizationId, caption || undefined);
        })(),
      ]);

      if (res.success && res.data) {
        const storyData = res.data as CreateStoryResponse;
        toast.success("สร้างสตอรี่สำเร็จ!");
        setShowVideoPreview(false);
        setSelectedVideoFile(null);

        // Immediately inject new story into storyGroups with client thumbnail
        const newStory = {
          id: storyData.id,
          videoUrl: storyData.videoUrl,
          thumbnailUrl: thumbnailDataUrl || storyData.thumbnailUrl || null,
          caption: storyData.caption || caption || null,
          transcript: null,
          duration: storyData.duration || null,
          isProcessing: true,
          expiresAt: storyData.expiresAt,
          createdAt: storyData.createdAt,
          user: {
            id: currentUserId,
            displayName: currentUserName,
            avatarUrl: currentUserAvatar,
          },
          isViewed: true,
        };

        setStoryGroups((prev) => {
          // Check if current user already has a group
          const existingIdx = prev.findIndex((g) => g.user.id === currentUserId);
          if (existingIdx >= 0) {
            // Append story to existing group
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              stories: [...updated[existingIdx].stories, newStory],
            };
            return updated;
          }
          // Create new group at the front
          return [
            {
              user: { id: currentUserId, displayName: currentUserName, avatarUrl: currentUserAvatar },
              stories: [newStory],
              hasUnviewed: false,
            },
            ...prev,
          ];
        });

        // Reload from server in background (server thumbnail will replace client one)
        setTimeout(() => {
          startTransition(() => { loadStories(); });
        }, 15000);
      } else {
        toast.error(res.message || "สร้างสตอรี่ไม่สำเร็จ");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenViewer = (groupIndex: number) => {
    setViewerGroupIndex(groupIndex);
    setViewerOpen(true);
  };

  const handleStoryViewed = (storyId: number) => {
    startTransition(async () => {
      await markStoryViewed(storyId);
      // Update local state
      setStoryGroups((prev) =>
        prev.map((g) => ({
          ...g,
          stories: g.stories.map((s) =>
            s.id === storyId ? { ...s, isViewed: true } : s,
          ),
          hasUnviewed: g.stories.some((s) => s.id !== storyId && !s.isViewed),
        })),
      );
    });
  };

  // ─── Feed Logic ───
  const loadFeed = useCallback(
    async (cursor?: number) => {
      const isInitial = !cursor;
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await getFeedPosts(projectId, organizationId, cursor);
        if (res.success) {
          const newPosts = res.data as FeedPostData[];
          setPosts((prev) => (isInitial ? newPosts : [...prev, ...newPosts]));
          setHasMore(res.hasMore);
          setNextCursor(res.nextCursor);
        }
      } catch {
        toast.error("ไม่สามารถโหลดฟีดได้");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [projectId, organizationId],
  );

  useEffect(() => {
    if (projectId && organizationId) {
      loadFeed();
    }
  }, [projectId, organizationId, loadFeed]);

  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor) {
          loadFeed(nextCursor);
        }
      },
      { threshold: 0.1 },
    );

    const target = observerTarget.current;
    if (target) observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loadingMore, nextCursor, loadFeed]);

  const handleLikeToggle = async (postId: number) => {
    const res = await toggleLikePost(postId);
    if (!res.success) toast.error(res.message || "ไลค์ไม่สำเร็จ");
  };

  const insertReply = (
    comments: FeedPostData["previewComments"],
    parentId: number,
    newReply: any,
  ): FeedPostData["previewComments"] => {
    return comments.map((c) => {
      if (c.id === parentId) {
        return { ...c, replies: [...(c.replies || []), newReply] };
      }
      if (c.replies?.length) {
        return { ...c, replies: insertReply(c.replies, parentId, newReply) };
      }
      return c;
    });
  };

  const handleComment = async (postId: number, content: string, parentId?: number, imageUrl?: string) => {
    const res = await createComment(postId, content, parentId, imageUrl);
    if (res.success && res.data) {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;

          const updatedComments = parentId
            ? insertReply(p.previewComments, parentId, res.data)
            : [...p.previewComments, res.data];

          return {
            ...p,
            _count: { ...p._count, comments: p._count.comments + 1 },
            previewComments: updatedComments,
          };
        }),
      );
    } else {
      toast.error(res.message || "แสดงความคิดเห็นไม่สำเร็จ");
    }
  };

  const handleShare = async (postId: number) => {
    const res = await sharePost(postId);
    if (res.success) {
      toast.success("แชร์เรียบร้อย (In development");
    } else {
      toast.error(res.message || "แชร์ไม่สำเร็จ");
    }
  };

  const toggleCommentLike = (
    comments: FeedPostData["previewComments"],
    commentId: number,
  ): FeedPostData["previewComments"] => {
    return comments.map((c) => {
      if (c.id === commentId) {
        return {
          ...c,
          isLiked: !c.isLiked,
          _count: { likes: c.isLiked ? c._count.likes - 1 : c._count.likes + 1 },
        };
      }
      if (c.replies?.length) {
        return { ...c, replies: toggleCommentLike(c.replies, commentId) };
      }
      return c;
    });
  };

  const handleLikeComment = async (postId: number, commentId: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, previewComments: toggleCommentLike(p.previewComments, commentId) }
          : p,
      ),
    );

    const res = await toggleLikeComment(commentId);
    if (!res.success) toast.error(res.message || "ไลค์ไม่สำเร็จ");
  };

  const handleLoadComments = async (postId: number) => {
    const res = await getCommentsByPost(postId);
    if (res.success) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, previewComments: res.data as FeedPostData["previewComments"] }
            : p,
        ),
      );
    }
  };

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="video/mp4,video/mov,video/quicktime,video/webm"
        className="hidden"
        onChange={handleFileSelected}
      />
      <input
        ref={recordInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Story Bar */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-default-200 dark:border-zinc-800 p-2">
          <StoryBar
            currentUserId={currentUserId}
            currentUserAvatar={currentUserAvatar}
            currentUserName={currentUserName}
            onCreateStory={handleUploadVideo}
            onOpenViewer={handleOpenViewer}
            storyGroups={storyGroups}
            loading={storiesLoading}
          />
        </div>

        {/* Feed Posts */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner color="primary" size="lg" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-default-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-default-200">
            <p className="text-default-400 font-bold text-lg">ยังไม่มีกิจกรรม</p>
            <p className="text-default-300 text-sm mt-1">
              เมื่อมีการสร้าง Task หรืออัปเดต Subtask จะแสดงที่นี่
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <FeedCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onLikeToggle={handleLikeToggle}
                onComment={handleComment}
                onShare={handleShare}
                onLoadComments={handleLoadComments}
                onLikeComment={handleLikeComment}
              />
            ))}
            {hasMore && (
              <div ref={observerTarget} className="flex justify-center py-6">
                {loadingMore && <Spinner color="primary" />}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <StoryFAB
        onUploadVideo={handleUploadVideo}
        onRecordVideo={handleRecordVideo}
      />

      {/* Video Preview Modal */}
      <AnimatePresence>
        {showVideoPreview && (
          <StoryVideoPreview
            videoFile={selectedVideoFile}
            videoUrl={null}
            onUpload={handleUploadStory}
            onCancel={() => {
              setShowVideoPreview(false);
              setSelectedVideoFile(null);
            }}
            isUploading={isUploading}
          />
        )}
      </AnimatePresence>

      {/* Story Viewer */}
      <AnimatePresence>
        {viewerOpen && storyGroups.length > 0 && (
          <StoryViewer
            storyGroups={storyGroups}
            initialGroupIndex={viewerGroupIndex}
            currentUserId={currentUserId}
            onClose={() => setViewerOpen(false)}
            onViewed={handleStoryViewed}
          />
        )}
      </AnimatePresence>
    </>
  );
}
