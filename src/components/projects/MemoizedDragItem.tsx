
import React from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Task } from "@/lib/type";


const calcProgress = (t: Task) => {
  if (!t.details || t.details.length === 0) return t.progressPercent || 0;
  const done = t.details.filter((s) => s.status === true).length;
  return Math.round((done / t.details.length) * 100);
};

interface MemoizedDragItemProps {
  t: Task;
  onClick: (id: number) => void;
}

export const MemoizedDragItem = React.memo(({ t, onClick }: MemoizedDragItemProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: t.id });
  const style = transform ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` } : undefined;

  return (
    <div ref={setNodeRef} style={style} className="bg-default-200 dark:bg-zinc-800 rounded-lg cursor-grab touch-none">
      <div {...listeners} {...attributes} onClick={() => onClick(t.id)} className="flex gap-3 p-3">
        <img src={t.coverImageUrl || "/placeholder-image.jpg"} className="w-12 h-12 rounded object-cover" alt={t.taskName || "Task"} loading="lazy" />
        <div className="min-w-0">
          <p className="text-sm truncate">{t.taskName || "Untitled Task"}</p>
          <p className="text-xs text-default-500 dark:text-zinc-400">{calcProgress(t)}%</p>
        </div>
      </div>
    </div>
  );
});

MemoizedDragItem.displayName = "MemoizedDragItem";