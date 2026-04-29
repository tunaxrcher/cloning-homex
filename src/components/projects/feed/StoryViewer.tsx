"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@heroui/react";
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import type { StoryViewerProps } from "@/lib/type";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาที`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชม.`;
  return `${Math.floor(hrs / 24)} วัน`;
}

export default function StoryViewer({
  storyGroups,
  initialGroupIndex,
  currentUserId,
  onClose,
  onViewed,
}: StoryViewerProps) {
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentGroup = storyGroups[groupIdx];
  const currentStory = currentGroup?.stories[storyIdx];

  // Define handlers first so useEffects can reference them
  const handleNext = useCallback(() => {
    if (!currentGroup) return;

    if (storyIdx < currentGroup.stories.length - 1) {
      setStoryIdx((prev) => prev + 1);
    } else if (groupIdx < storyGroups.length - 1) {
      setGroupIdx((prev) => prev + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  }, [groupIdx, storyIdx, currentGroup, storyGroups.length, onClose]);

  const handlePrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx((prev) => prev - 1);
    } else if (groupIdx > 0) {
      setGroupIdx((prev) => prev - 1);
      const prevGroup = storyGroups[groupIdx - 1];
      setStoryIdx(prevGroup.stories.length - 1);
    }
  }, [groupIdx, storyIdx, storyGroups]);

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !currentStory.isViewed) {
      onViewed(currentStory.id);
    }
  }, [currentStory?.id, onViewed]);

  // Progress bar & auto-advance
  useEffect(() => {
    if (!currentStory) return;

    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration && video.duration > 0) {
        const pct = (video.currentTime / video.duration) * 100;
        setProgress(pct);
      }
    };

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("ended", handleNext);

    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("ended", handleNext);
    };
  }, [currentStory?.id, handleNext]);

  // Reset state when story changes
  useEffect(() => {
    setProgress(0);
    setVideoError(false);
    setVideoLoading(true);
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  }, [groupIdx, storyIdx]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNext, handlePrev, onClose]);

  if (!currentGroup || !currentStory) return null;

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const threshold = rect.width * 0.35;

    if (x < threshold) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
    >
      {/* Navigation Arrows (Desktop) */}
      <button
        onClick={handlePrev}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center transition-colors"
      >
        <ChevronLeft size={24} className="text-white" />
      </button>
      <button
        onClick={handleNext}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center transition-colors"
      >
        <ChevronRight size={24} className="text-white" />
      </button>

      {/* Story Container */}
      <div
        className="relative w-full max-w-[420px] h-full max-h-[90vh] md:rounded-2xl overflow-hidden bg-black"
        onClick={handleTap}
      >
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-3">
          {currentGroup.stories.map((_, idx) => (
            <div
              key={idx}
              className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden"
            >
              <div
                className="h-full bg-white rounded-full transition-all duration-100"
                style={{
                  width:
                    idx < storyIdx
                      ? "100%"
                      : idx === storyIdx
                      ? `${progress}%`
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent pt-8 px-4 pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar
                src={currentGroup.user.avatarUrl || undefined}
                name={currentGroup.user.displayName?.[0] || "?"}
                size="sm"
                className="border-2 border-white/30"
              />
              <div>
                <p className="text-white text-sm font-semibold leading-tight">
                  {currentGroup.user.displayName || "ผู้ใช้"}
                </p>
                <p className="text-white/60 text-[11px]">
                  {timeAgo(currentStory.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted((v) => !v);
                }}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                {isMuted ? (
                  <VolumeX size={16} className="text-white" />
                ) : (
                  <Volume2 size={16} className="text-white" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Video */}
        <video
          key={currentStory.id}
          ref={videoRef}
          src={currentStory.videoUrl}
          className="w-full h-full object-contain"
          autoPlay
          playsInline
          muted={isMuted}
          onLoadedData={() => setVideoLoading(false)}
          onError={() => { setVideoError(true); setVideoLoading(false); }}
        />

        {/* Video Loading */}
        {videoLoading && !videoError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Video Error */}
        {videoError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2">
            <p className="text-white/70 text-sm">ไม่สามารถโหลดวิดีโอได้</p>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="text-xs text-white/50 underline"
            >
              ข้ามไปเรื่องถัดไป
            </button>
          </div>
        )}

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent px-4 pb-6 pt-12">
            <p className="text-white text-sm leading-relaxed">
              {currentStory.caption}
            </p>
          </div>
        )}

        {/* Processing indicator */}
        {currentStory.isProcessing && (
          <div className="absolute bottom-4 right-4 z-20 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-white/80 text-[11px]">AI กำลังถอดเสียง...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
