"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Avatar } from "@heroui/react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import type { StoryBarProps } from "@/lib/type";

const CARD_W = 128;
const CARD_H = 200;
const GAP = 8;

const CARD_GRADIENTS = [
  "from-blue-600 to-blue-400",
  "from-emerald-600 to-emerald-400",
  "from-violet-600 to-violet-400",
  "from-orange-600 to-orange-400",
  "from-rose-600 to-rose-400",
  "from-cyan-600 to-cyan-400",
  "from-fuchsia-600 to-fuchsia-400",
  "from-amber-600 to-amber-400",
];

export default function StoryBar({
  currentUserId,
  currentUserAvatar,
  currentUserName,
  onCreateStory,
  onOpenViewer,
  storyGroups,
  loading,
}: StoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, storyGroups.length, loading]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = (CARD_W + GAP) * 2;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="relative group/tray">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide"
      >
        {/* ── Create Story Card ── */}
        <button
          onClick={onCreateStory}
          className="shrink-0 rounded-xl overflow-hidden shadow-sm border border-default-200 dark:border-zinc-700 hover:shadow-md transition-shadow focus:outline-none"
          style={{ width: CARD_W, height: CARD_H }}
        >
          <div className="relative h-full flex flex-col">
            {/* Avatar background (top ~65%) */}
            <div className="relative flex-1 overflow-hidden bg-default-200 dark:bg-zinc-700">
              {currentUserAvatar ? (
                <img
                  src={currentUserAvatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary/40">
                    {currentUserName?.[0] || "?"}
                  </span>
                </div>
              )}
            </div>

            {/* Plus icon (centered on the divider) */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[52px] z-10">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center border-[3px] border-white dark:border-zinc-900 shadow">
                <Plus size={20} className="text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Bottom label */}
            <div className="h-[48px] bg-white dark:bg-zinc-800 flex items-end justify-center pb-2 pt-4">
              <span className="text-xs font-semibold text-default-700 dark:text-zinc-200">
                สร้างสตอรี่
              </span>
            </div>
          </div>
        </button>

        {/* ── Story Cards ── */}
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="shrink-0 rounded-xl bg-default-200 dark:bg-zinc-700 animate-pulse"
                style={{ width: CARD_W, height: CARD_H }}
              />
            ))}
          </>
        ) : (
          storyGroups.map((group, idx) => {
            const latestStory = group.stories[group.stories.length - 1];
            const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];

            return (
              <button
                key={group.user.id}
                onClick={() => onOpenViewer(idx)}
                className="shrink-0 rounded-xl overflow-hidden shadow-sm border border-default-200 dark:border-zinc-700 hover:shadow-md transition-shadow focus:outline-none relative"
                style={{ width: CARD_W, height: CARD_H }}
              >
                {/* Card Background — thumbnail or gradient */}
                {latestStory?.thumbnailUrl ? (
                  <img
                    src={latestStory.thumbnailUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                )}

                {/* Dim overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Profile avatar — top-left */}
                <div className="absolute top-3 left-3 z-10">
                  <div
                    className={`rounded-full p-[2.5px] ${
                      group.hasUnviewed
                        ? "bg-primary"
                        : "bg-default-400/50"
                    }`}
                  >
                    <div className="rounded-full p-[1.5px] bg-white dark:bg-zinc-900">
                      <Avatar
                        src={group.user.avatarUrl || undefined}
                        name={group.user.displayName?.[0] || "?"}
                        className="w-8 h-8 text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Username — bottom-left */}
                <div className="absolute bottom-0 left-0 right-0 z-10 p-2.5">
                  <p className="text-white text-xs font-semibold leading-tight drop-shadow-md line-clamp-2">
                    {group.user.id === currentUserId
                      ? "สตอรี่ของคุณ"
                      : group.user.displayName || "ผู้ใช้"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* ── Carousel Arrows ── */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-default-200 dark:border-zinc-600 flex items-center justify-center opacity-0 group-hover/tray:opacity-100 transition-opacity hover:bg-default-100 dark:hover:bg-zinc-700"
        >
          <ChevronLeft size={16} className="text-default-600" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-default-200 dark:border-zinc-600 flex items-center justify-center opacity-0 group-hover/tray:opacity-100 transition-opacity hover:bg-default-100 dark:hover:bg-zinc-700"
        >
          <ChevronRight size={16} className="text-default-600" />
        </button>
      )}
    </div>
  );
}
