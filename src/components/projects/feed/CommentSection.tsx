"use client";

import { useState, useRef } from "react";
import { Avatar, Button, Input } from "@heroui/react";
import { CornerDownRight, Send, ImageIcon, X } from "lucide-react";
import type { CommentSectionProps, FeedCommentData } from "@/lib/type";
import { sendbase64toS3DataVdo } from "@/lib/actions/actionIndex";
import { useSession } from "next-auth/react";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาที`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชม.`;
  const days = Math.floor(hrs / 24);
  return `${days} วัน`;
}

function countAllReplies(replies: FeedCommentData[]): number {
  let count = replies.length;
  for (const r of replies) {
    if (r.replies?.length) count += countAllReplies(r.replies);
  }
  return count;
}

async function uploadImage(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const result = await sendbase64toS3DataVdo(formData, "feed_comments");
    if (!result.success || !result.url) return null;
    return result.url;
  } catch {
    return null;
  }
}

function CommentInput({
  placeholder,
  autoFocus,
  onSubmit,
  onCancel,
  className,
  avatarUrl,
}: {
  placeholder: string;
  autoFocus?: boolean;
  onSubmit: (text: string, imageUrl?: string) => void;
  onCancel?: () => void;
  className?: string;
  avatarUrl?: string | null;
}) {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!text.trim() && !imageFile) return;
    setUploading(true);
    try {
      let url: string | undefined;
      if (imageFile) {
        const uploaded = await uploadImage(imageFile);
        if (uploaded) url = uploaded;
      }
      onSubmit(text.trim(), url);
      setText("");
      clearImage();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      {imagePreview && (
        <div className="relative inline-block mb-1.5">
          <img
            src={imagePreview}
            alt="preview"
            className="max-h-28 rounded-lg border border-default-200"
          />
          <button
            onClick={clearImage}
            className="absolute -top-1.5 -right-1.5 bg-default-800 text-white rounded-full p-0.5"
          >
            <X size={12} />
          </button>
        </div>
      )}
      <div className="flex items-center gap-1">
        <Input
          size="sm"
          radius="full"
          placeholder={placeholder}
          value={text}
          onValueChange={setText}
          autoFocus={autoFocus}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
            if (e.key === "Escape" && onCancel) onCancel();
          }}
          classNames={{
            inputWrapper: "bg-default-100 dark:bg-zinc-800 h-8",
            input: "text-sm",
          }}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePickImage}
        />
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={() => fileRef.current?.click()}
          className="text-default-400"
        >
          <ImageIcon size={16} />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          color="primary"
          onPress={handleSubmit}
          isDisabled={(!text.trim() && !imageFile) || uploading}
          isLoading={uploading}
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onLike,
  replyTo,
  onSetReplyTo,
  onSubmitReply,
  currentUserAvatar,
  depth = 0,
}: {
  comment: FeedCommentData;
  currentUserId: number;
  onLike: (commentId: number) => void;
  replyTo: number | null;
  onSetReplyTo: (parentId: number | null) => void;
  onSubmitReply: (parentId: number, text: string, imageUrl?: string) => void;
  currentUserAvatar?: string | null;
  depth?: number;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const replies = comment.replies || [];
  const totalReplies = replies.length > 0 ? countAllReplies(replies) : 0;

  return (
    <div className={`flex gap-2 ${depth > 0 ? "ml-8 mt-2" : "mt-3"}`}>
      <Avatar
        src={comment.user.avatarUrl || undefined}
        name={comment.user.displayName?.[0] || "?"}
        size="sm"
        className="shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="bg-default-100 dark:bg-zinc-800 rounded-2xl px-3 py-2">
          <p className="text-xs font-semibold">{comment.user.displayName || "Unknown"}</p>
          {comment.content && <p className="text-sm break-words">{comment.content}</p>}
          {comment.imageUrl && (
            <img
              src={comment.imageUrl}
              alt="comment"
              className="mt-1.5 max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(comment.imageUrl!, "_blank")}
            />
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 ml-2">
          <button
            onClick={() => onLike(comment.id)}
            className={`text-[11px] font-semibold hover:underline ${comment.isLiked ? "text-primary" : "text-default-400"}`}
          >
            ถูกใจ{comment._count.likes > 0 && ` ${comment._count.likes}`}
          </button>
          <button
            onClick={() => onSetReplyTo(comment.id)}
            className="text-[11px] font-semibold text-default-400 hover:underline"
          >
            ตอบกลับ
          </button>
          <span className="text-[11px] text-default-300">{timeAgo(comment.createdAt)}</span>
        </div>

        {totalReplies > 0 && !showReplies && (
          <button
            onClick={() => setShowReplies(true)}
            className="flex items-center gap-1.5 mt-1.5 ml-2 text-[12px] font-semibold text-default-500 hover:underline"
          >
            <CornerDownRight size={13} />
            ดู {totalReplies} ข้อความตอบกลับ
          </button>
        )}

        {showReplies &&
          replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              currentUserId={currentUserId}
              onLike={onLike}
              replyTo={replyTo}
              onSetReplyTo={onSetReplyTo}
              onSubmitReply={onSubmitReply}
              currentUserAvatar={currentUserAvatar}
              depth={depth + 1}
            />
          ))}

        {replyTo === comment.id && (
          <div className="mt-2 ml-8 flex items-start gap-2">
            <Avatar
              src={currentUserAvatar || undefined}
              size="sm"
              className="shrink-0 mt-1"
            />
            <CommentInput
              placeholder="เขียนตอบกลับ..."
              autoFocus
              className="flex-1"
              onSubmit={(text, imageUrl) => {
                onSubmitReply(comment.id, text, imageUrl);
                setShowReplies(true);
              }}
              onCancel={() => onSetReplyTo(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({
  postId,
  comments,
  currentUserId,
  onComment,
  onLikeComment,
  totalComments,
  onLoadAll,
}: CommentSectionProps) {
  const session = useSession();
  const currentUserAvatar = session.data?.user?.avatarUrl ?? null;
  const [replyTo, setReplyTo] = useState<number | null>(null);

  const handleSubmitReply = (parentId: number, content: string, imageUrl?: string) => {
    onComment(postId, content, parentId, imageUrl);
    setReplyTo(null);
  };

  return (
    <div className="px-4 pb-3">
      {totalComments > comments.length && (
        <button
          onClick={onLoadAll}
          className="text-xs font-semibold text-default-400 hover:underline mb-2"
        >
          ดูความคิดเห็นทั้งหมด ({totalComments})
        </button>
      )}

      {comments.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          currentUserId={currentUserId}
          onLike={(commentId) => onLikeComment(postId, commentId)}
          replyTo={replyTo}
          onSetReplyTo={setReplyTo}
          onSubmitReply={handleSubmitReply}
          currentUserAvatar={currentUserAvatar}
        />
      ))}

      <div className="flex items-center gap-2 mt-3">
        <Avatar
          src={currentUserAvatar || undefined}
          size="sm"
          className="shrink-0"
        />
        <CommentInput
          placeholder="เขียนความคิดเห็น..."
          className="flex-1"
          onSubmit={(text, imageUrl) => onComment(postId, text, undefined, imageUrl)}
        />
      </div>
    </div>
  );
}
