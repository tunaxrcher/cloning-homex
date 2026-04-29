"use client";

import { useState } from "react";
import { Avatar, Divider } from "@heroui/react";
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  Globe,
  CheckCircle2,
  PlusCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import type { FeedCardProps, FeedType } from "@/lib/type";
import CommentSection from "./CommentSection";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาที`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชม.`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} วัน`;
  const weeks = Math.floor(days / 7);
  return `${weeks} สัปดาห์`;
}

function feedIcon(feedType: FeedType) {
  switch (feedType) {
    case "TASK_CREATED":
      return <PlusCircle size={14} className="text-primary" />;
    case "SUBTASK_COMPLETED":
      return <CheckCircle2 size={14} className="text-success" />;
    case "SUBTASK_UPDATED":
      return <Pencil size={14} className="text-warning" />;
    case "SUBTASK_DELETED":
      return <Trash2 size={14} className="text-danger" />;
    default:
      return null;
  }
}

function feedLabel(feedType: FeedType) {
  switch (feedType) {
    case "TASK_CREATED":
      return "สร้างงานใหม่";
    case "SUBTASK_COMPLETED":
      return "สำเร็จรายการย่อย";
    case "SUBTASK_UPDATED":
      return "อัปเดตรายการย่อย";
    case "SUBTASK_DELETED":
      return "ลบรายการย่อย";
    default:
      return "";
  }
}

export default function FeedCard({
  post,
  currentUserId,
  onLikeToggle,
  onComment,
  onShare,
  onLoadComments,
  onLikeComment,
}: FeedCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [commentCount, setCommentCount] = useState(post._count.comments);
  const [shareCount, setShareCount] = useState(post._count.shares);
  const [isLiked, setIsLiked] = useState(post.isLiked);

  const handleLike = () => {
    setIsLiked((prev) => !prev);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLikeToggle(post.id);
  };

  const handleComment = (postId: number, content: string, parentId?: number, imageUrl?: string) => {
    onComment(postId, content, parentId, imageUrl);
    setCommentCount((prev) => prev + 1);
  };

  const handleShare = () => {
    setShareCount((prev) => prev + 1);
    onShare(post.id);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-default-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-2">
        <Avatar
          src={post.user.avatarUrl || undefined}
          name={post.user.displayName?.[0] || "?"}
          size="md"
          className="shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-sm">{post.user.displayName || "Unknown"}</p>
            <span className="flex items-center gap-1 text-xs text-default-400">
              {feedIcon(post.feedType)}
              {feedLabel(post.feedType)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-default-400">
            <span>{timeAgo(post.createdAt)}</span>
            <span>·</span>
            <Globe size={11} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt="Task cover"
            className="mt-2 w-full max-h-72 object-cover rounded-xl"
          />
        )}
        {post.task && (
          <div className="mt-2 bg-default-50 dark:bg-zinc-800/60 border border-default-200 dark:border-zinc-700 rounded-lg px-3 py-2">
            <p className="text-xs text-default-400 font-medium">Task</p>
            <p className="text-sm font-semibold">{post.task.taskName}</p>
            {post.subtask && (
              <p className="text-xs text-default-500 mt-0.5">
                → {post.subtask.detailName}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Counts bar */}
      {(likeCount > 0 || commentCount > 0 || shareCount > 0) && (
        <div className="flex items-center justify-between px-4 pb-1">
          <div className="flex items-center gap-1.5">
            {likeCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-default-400">
                <span className="w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center">
                  <ThumbsUp size={10} className="text-white" />
                </span>
                {likeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-default-400">
            {commentCount > 0 && (
              <button
                onClick={() => setShowComments(true)}
                className="hover:underline"
              >
                {commentCount} ความคิดเห็น
              </button>
            )}
            {shareCount > 0 && <span>{shareCount} แชร์</span>}
          </div>
        </div>
      )}

      <Divider className="my-1" />

      {/* Action buttons */}
      <div className="grid grid-cols-3 px-1 py-0.5">
        <button
          onClick={handleLike}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-default-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium ${
            isLiked ? "text-primary" : "text-default-500"
          }`}
        >
          <ThumbsUp size={18} className={isLiked ? "fill-primary" : ""} />
          <span className="hidden sm:inline">ถูกใจ</span>
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-default-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium text-default-500"
        >
          <MessageCircle size={18} />
          <span className="hidden sm:inline">แสดงความคิดเห็น</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-default-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium text-default-500"
        >
          <Share2 size={18} />
          <span className="hidden sm:inline">แชร์</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <>
          <Divider />
          <CommentSection
            postId={post.id}
            comments={post.previewComments}
            currentUserId={currentUserId}
            onComment={handleComment}
            onLikeComment={onLikeComment}
            totalComments={commentCount}
            onLoadAll={() => onLoadComments(post.id)}
          />
        </>
      )}
    </div>
  );
}
