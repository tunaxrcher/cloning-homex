import { useState } from "react";
import { ExecutiveSummaryProps } from "@/lib/type";
import {
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  TrendingDown,
  CircleDashed, 
} from "lucide-react";

const ExecutiveSummary = ({
  isAnalyzing,
  summaryData,
}: ExecutiveSummaryProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-[#12151a] border border-zinc-800/60 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-black/20">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
      <div className="flex items-center justify-between mb-6 relative z-10 border-b border-zinc-800/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 rounded-xl border border-blue-500/10 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              ภาพรวมโปรเจค
              <span className="text-xs font-medium text-zinc-500 px-2 py-0.5 bg-zinc-800/50 rounded-md">
                AI Overview
              </span>
            </h2>
          </div>
        </div>
        {!isAnalyzing && summaryData?.healthStatus && (
          <div
            className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5 shadow-sm border ${
              summaryData.healthStatus === "GOOD"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : summaryData.healthStatus === "WARNING"
                  ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            {summaryData.healthStatus === "CRITICAL" ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : summaryData.healthStatus === "GOOD" ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}

            {summaryData.healthStatus === "GOOD"
              ? "สถานะปกติ"
              : summaryData.healthStatus === "WARNING"
                ? "ต้องเฝ้าระวัง"
                : "ขั้นวิกฤต"}
          </div>
        )}
      </div>

      {/* Content Area */}
      {isAnalyzing ? (
        <div className="relative z-10 min-h-[200px] flex items-center justify-center">
          <div className="absolute inset-0 space-y-6 opacity-20 blur-sm pointer-events-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="h-4 bg-zinc-700 rounded w-1/4"></div>
                <div className="h-20 bg-zinc-700 rounded-xl"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-zinc-700 rounded w-1/4"></div>
                <div className="h-20 bg-zinc-700 rounded-xl"></div>
              </div>
            </div>
          </div>

          {/* ตัวหมุน AI ตรงกลาง */}
          <div className="relative flex flex-col items-center justify-center gap-3 z-20 bg-[#12151a]/80 p-6 rounded-2xl shadow-2xl backdrop-blur-md border border-zinc-800/50">
            <CircleDashed className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-blue-400 animate-pulse tracking-wide">
              AI กำลังวิเคราะห์ภาพรวมโปรเจค...
            </p>
          </div>
        </div>
      ) : summaryData ? (
        <div className="relative z-10 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="bg-[#181d24] border border-zinc-800/60 rounded-xl p-4.5 hover:border-zinc-700/60 transition-colors">
              <h3 className="text-[11px] text-zinc-400 font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>{" "}
                ภาพรวมโครงการ
              </h3>
              <p
                className={`text-sm text-zinc-300 leading-relaxed ${!isExpanded ? "line-clamp-3" : ""}`}
              >
                {summaryData.executiveSummary}
              </p>
            </div>

            {/* กล่อง Budget */}
            <div className="bg-[#181d24] border border-zinc-800/60 rounded-xl p-4.5 hover:border-zinc-700/60 transition-colors">
              <h3 className="text-[11px] text-zinc-400 font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>{" "}
                สถานะการเงิน
              </h3>
              <p
                className={`text-sm text-zinc-300 leading-relaxed ${!isExpanded ? "line-clamp-3" : ""}`}
              >
                {summaryData.budgetAnalysis}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-7 bg-blue-950/10 border border-blue-900/30 rounded-xl p-4.5 flex flex-col justify-center">
              <h3 className="text-xs text-blue-400 font-bold mb-2 flex items-center gap-1.5">
                💡 ข้อเสนอแนะเชิงรุก
              </h3>
              <p
                className={`text-sm text-blue-200/80 leading-relaxed ${!isExpanded ? "line-clamp-2" : ""}`}
              >
                {summaryData.recommendation}
              </p>
            </div>

            <div className="md:col-span-5 bg-red-950/10 border border-red-900/30 rounded-xl p-4.5">
              <h3 className="text-xs text-red-400 font-bold mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> ความเสี่ยงที่ต้องจับตา
              </h3>
              {summaryData.topRisks && summaryData.topRisks.length > 0 ? (
                <ul className="space-y-2">
                  {(isExpanded
                    ? summaryData.topRisks
                    : summaryData.topRisks.slice(0, 2)
                  ).map((risk, i) => (
                    <li
                      key={i}
                      className="flex gap-2.5 text-sm text-zinc-300 items-start"
                    >
                      <span className="text-red-500/70 mt-0.5 text-[10px]">
                        ■
                      </span>
                      <span
                        className={`leading-snug ${!isExpanded ? "line-clamp-1" : ""}`}
                      >
                        {risk}
                      </span>
                    </li>
                  ))}
                  {!isExpanded && summaryData.topRisks.length > 2 && (
                    <li className="text-[10px] text-zinc-500 pt-1 italic">
                      + มีความเสี่ยงอื่นอีก {summaryData.topRisks.length - 2}{" "}
                      รายการ
                    </li>
                  )}
                </ul>
              ) : (
                <div className="text-xs text-zinc-500 italic py-2">
                  ไม่พบความเสี่ยงที่มีนัยสำคัญ
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center mt-5 pt-4 border-t border-zinc-800/40">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/40 hover:bg-zinc-700/50 px-4 py-1.5 rounded-full transition-all"
            >
              {isExpanded ? (
                <>
                  ย่อเนื้อหา <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  อ่านเพิ่มเติม <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-zinc-500 gap-3">
          <div className="p-3 bg-zinc-800/30 rounded-full">
            <Sparkles className="w-6 h-6 opacity-40" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-400">
              ไม่สามารถวิเคราะห์ข้อมูลได้
            </p>
            <p className="text-xs opacity-60 mt-1">
              อาจไม่มีข้อมูลเพียงพอ หรือเกิดข้อผิดพลาดในการเชื่อมต่อ AI
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveSummary;
