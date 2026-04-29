import { useState } from "react";
import {
  AlertCircle,
  CircleDashed,
  Calendar,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { ActionRequiredListProps } from "@/lib/type";

const ActionRequiredList = ({
  isAnalyzing,
  aiActions,
}: ActionRequiredListProps) => {
  const [showAll, setShowAll] = useState(false);

  // ใช้ optional chaining ป้องกันกรณี aiActions เป็น null/undefined
  const displayedActions = showAll ? aiActions : aiActions?.slice(0, 3) || [];
  const hasMore = (aiActions?.length || 0) > 3;

  return (
    <div className="bg-[#161b22] border border-zinc-800/80 rounded-xl p-5 lg:col-span-2">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          สิ่งที่ต้องจัดการด่วน (Action Required)
        </h2>
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showAll ? "ย่อรายการลง" : `ดูทั้งหมด (${aiActions.length})`}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {isAnalyzing ? (
          // 🌟 ปรับให้ดูเป็น AI ที่กำลังประมวลผลจริงๆ
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <CircleDashed className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs text-zinc-500 animate-pulse tracking-wide">
              AI กำลังวิเคราะห์ข้อมูลโครงการ...
            </span>
          </div>
        ) : aiActions && aiActions.length > 0 ? (
          <>
            {displayedActions.map((action, index) => (
              <div
                // 🌟 ปรับ Key ให้ปลอดภัยขึ้น
                key={`action-${action.type}-${action.id || index}`}
                className="flex gap-4 items-start pb-4 border-b border-zinc-800/50 last:border-0 last:pb-0 animate-in fade-in duration-500"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                    action.type === "DELAY"
                      ? "bg-red-950/40 border-red-900/50 text-red-400"
                      : action.type === "BUDGET"
                        ? "bg-yellow-950/40 border-yellow-900/50 text-yellow-400"
                        : "bg-blue-950/40 border-blue-900/50 text-blue-400"
                  }`}
                >
                  {action.type === "DELAY" ? (
                    <Calendar className="w-4 h-4" />
                  ) : action.type === "BUDGET" ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {" "}
                  {/* min-w-0 ช่วยให้ text-truncate ทำงานได้ดีขึ้น */}
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-medium text-white mb-1 truncate">
                      {action.title}
                    </h4>
                    <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                      {action.time}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-2 leading-relaxed">
                    {action.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="bg-zinc-800/80 text-zinc-400 text-[10px] px-2 py-0.5 rounded border border-zinc-700/50">
                      {action.tag}
                    </span>
                    {/* 🌟 ถ้ามีฟิลด์ priority ก็สามารถเพิ่มป้ายกำกับได้ที่นี่ */}
                    {action.priority === "HIGH" && (
                      <span className="text-[9px] text-red-500 font-bold uppercase tracking-tighter">
                        High Priority
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!showAll && hasMore && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full mt-2 py-2 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg border border-zinc-800/50 transition-all"
              >
                ดูรายการแจ้งเตือนอีก {aiActions.length - 3} รายการ...
              </button>
            )}
          </>
        ) : (
          // 🌟 ปรับให้ดูสะอาดตาขึ้นเวลาไม่มีงาน
          <div className="py-10 flex flex-col items-center justify-center text-zinc-600 gap-2">
            <span className="text-2xl">🎉</span>
            <span className="text-xs font-light">
              ไม่มีรายการแจ้งเตือนด่วนในขณะนี้
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionRequiredList;
