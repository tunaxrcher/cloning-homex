import React from "react";
import { useDroppable } from "@dnd-kit/core";
import type { DropColumnProps } from "@/lib/type";
import { MemoizedDragItem } from "./MemoizedDragItem";
import { getColumnStyleMainTas } from "@/lib/setting_data";

export const DropColumn = React.memo(
  ({ status, tasks, onTaskClick }: DropColumnProps) => {
    const { setNodeRef } = useDroppable({ id: status });
    const style = getColumnStyleMainTas(status);
    return (
      <div
        ref={setNodeRef}
        className={`${style.background} ${style.border} border-x border-b p-4 rounded-xl min-w-[300px] flex-1 flex flex-col transition-colors`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-bold flex items-center gap-2 ${style.text}`}>
            <span>{style.icon}</span>
            {status}
          </h3>
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${style.badge}`}
          >
            {tasks.length}
          </span>
        </div>
        <div className="space-y-3 flex-1 h-full min-h-[150px]">
          {tasks.map((t) => (
            <MemoizedDragItem key={t.id} t={t} onClick={onTaskClick} />
          ))}
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-24 border-2 border-dashed border-default-300/50 dark:border-zinc-700/50 rounded-lg text-default-400 text-sm font-medium">
              วางงานที่นี่
            </div>
          )}
        </div>
      </div>
    );
  },
);

DropColumn.displayName = "DropColumn";
