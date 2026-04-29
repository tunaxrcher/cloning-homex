import { calculateRiskScore } from "@/lib/setting_data";
import { ProjectMetricsBoard } from "@/lib/type";
import { useEffect, useState } from "react";

const RiskScoreDashboard = ({
  actualProgress,
  plannedProgress,
  budgetSpentPercent,
  delayTasksCount,
}: ProjectMetricsBoard) => {
  const [currentMetrics, setcurrentMetrics] = useState({
    actualProgress: 0,
    plannedProgress: 0,
    budgetSpentPercent: 0,
    delayTasksCount: 0,
  });

  useEffect(() => {
    setcurrentMetrics({
      actualProgress: actualProgress,
      plannedProgress: plannedProgress,
      budgetSpentPercent: budgetSpentPercent,
      delayTasksCount: delayTasksCount,
    });
  }, [actualProgress, plannedProgress, budgetSpentPercent, delayTasksCount]);

  const aiEvaluation = calculateRiskScore(currentMetrics);

  return (
    <div className="bg-[#161b22] border border-zinc-800/80 p-5 rounded-xl flex items-center gap-4 relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl"></div>

      <div
        className={`w-14 h-14 rounded-full border-4 border-zinc-700 flex items-center justify-center relative`}
      >
        <span className={`text-xl font-bold ${aiEvaluation.colorClass}`}>
          {aiEvaluation.grade}
        </span>
      </div>

      <div>
        <h3
          className={`text-sm font-medium flex items-center gap-2 mb-1 ${aiEvaluation.colorClass}`}
        >
          <div className="w-2 h-2 rounded-full animate-pulse bg-current"></div>
          Risk Score ({aiEvaluation.score}/100)
        </h3>

        {/* ดึงข้อความจากฟังก์ชันมาแสดง */}
        <p className="text-lg font-bold text-white">{aiEvaluation.riskLevel}</p>
        <p className="text-[10px] text-zinc-400">{aiEvaluation.suggestion}</p>
      </div>
    </div>
  );
};

export default RiskScoreDashboard;
