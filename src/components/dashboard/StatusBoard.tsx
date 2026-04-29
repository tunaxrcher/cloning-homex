"use client";

import { ListTodo } from "lucide-react";
import { StatusBoardProps } from "@/lib/type";

const StatusBoard = ({
  todo = 0,
  progress = 0,
  done = 0,
  delay = 0,
  isLoading = false,
}: StatusBoardProps) => {
  return (
    <div className="bg-[#161b22] border border-zinc-800/80 p-5 rounded-xl flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm text-zinc-400">สถานะงาน (Tasks)</h3>
        <ListTodo className="w-4 h-4 text-purple-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* TODO */}
        <div className="bg-zinc-800/50 rounded-lg p-2 text-center flex flex-col justify-center min-h-[60px]">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          ) : (
            <span className="text-xl font-bold text-white">{todo}</span>
          )}
          <span className="text-[9px] text-zinc-400 font-mono mt-1">TODO</span>
        </div>

        {/* PROGRESS */}
        <div className="bg-blue-900/20 rounded-lg p-2 text-center border border-blue-900/30 flex flex-col justify-center min-h-[60px]">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          ) : (
            <span className="text-xl font-bold text-blue-400">
              {progress}
            </span>
          )}
          <span className="text-[9px] text-blue-400 font-mono mt-1">
            PROGRESS
          </span>
        </div>

        {/* DONE */}
        <div className="bg-green-900/20 rounded-lg p-2 text-center border border-green-900/30 flex flex-col justify-center min-h-[60px]">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          ) : (
            <span className="text-xl font-bold text-green-400">
              {done}
            </span>
          )}
          <span className="text-[9px] text-green-400 font-mono mt-1">DONE</span>
        </div>

        {/* DELAY */}
        <div className="bg-red-900/20 rounded-lg p-2 text-center border border-red-900/30 flex flex-col justify-center min-h-[60px]">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          ) : (
            <span className="text-xl font-bold text-red-400">
              {delay}
            </span>
          )}
          <span className="text-[9px] text-red-400 font-mono mt-1">DELAY</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBoard;
