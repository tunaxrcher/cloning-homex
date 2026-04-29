"use client";

import StatusBoard from "@/components/dashboard/StatusBoard";
import { ProjectDashboardProp } from "@/lib/type";
import { TrendingDown, Video, Sparkles } from "lucide-react";
import RiskScoreDashboard from "./RiskScoreDashboard";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";

import {
  getProjectPlannedProgress,
  getTaskDataForAIAnalysis,
  getTaskDataForAIAnalysisSum,
  getTaskStatusCountsBoard,
} from "@/lib/actions/actionProject";
import {
  analyzeProjectActions,
  analyzeProjectOverview,
} from "@/lib/ai/geminiAI";
import ActionRequiredList from "./ActionRequiredList";
import ExecutiveSummary from "./ExecutiveSummary";
import ReadOnlyMapping360 from "./ReadOnlyMapping360";
import ReadOnlyLiveView from "./ReadOnlyLiveView";

export default function ProjectDashboard({
  projectId,
  organizationId,
  projectInfo,
  projectProgress,
  expenses = 0,
}: ProjectDashboardProp) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingSummary, setIsAnalyzingSummary] = useState(false);

  const [aiSummary, setAiSummary] = useState<any>(null);
  const [aiActions, setAiActions] = useState<any[]>([]);

  const [rawActionData, setRawActionData] = useState<any>(null);
  const [rawSummaryData, setRawSummaryData] = useState<any>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false); // เช็คว่าเคยกดปุ่มหรือยัง

  const [counts, setCounts] = useState({
    todo: 0,
    progress: 0,
    done: 0,
    delay: 0,
  });
  const [planProgress, setPlanProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🌟 1. ดึงข้อมูลดิบอย่างเดียว (ไม่เรียก AI)
  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [statusData, planData, actionData, summaryData] =
          await Promise.all([
            getTaskStatusCountsBoard(projectId),
            getProjectPlannedProgress(projectId),
            getTaskDataForAIAnalysis(projectId),
            getTaskDataForAIAnalysisSum(projectId),
          ]);

        setCounts(statusData);
        setPlanProgress(planData);

        // เก็บข้อมูลไว้รอผู้ใช้กดปุ่ม
        setRawActionData(actionData);
        setRawSummaryData(summaryData);
      } catch (error) {
        console.error("❌ Fetch Data Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // 🌟 2. ฟังก์ชันเมื่อผู้ใช้กดปุ่ม "วิเคราะห์ด้วย AI"
  const handleRunAI = async () => {
    setHasAnalyzed(true); // โชว์กล่อง AI
    setIsAnalyzing(true); // ให้กล่องขึ้นสถานะโหลด
    setIsAnalyzingSummary(true);

    const aiPromises = [];

    // เรียก AI Action Required
    if (rawActionData?.tasks?.length > 0) {
      const actionPromise = analyzeProjectActions(
        rawActionData.tasks,
        rawActionData.projectInfo,
        rawActionData.referenceDate,
      )
        .then((res) => setAiActions(res))
        .catch((err) => console.error(err))
        .finally(() => setIsAnalyzing(false));

      aiPromises.push(actionPromise);
    } else {
      setAiActions([]);
      setIsAnalyzing(false);
    }

    // เรียก AI Executive Summary
    if (rawSummaryData?.tasks?.length > 0) {
      const summaryPromise = analyzeProjectOverview(
        rawSummaryData.tasks,
        rawSummaryData.projectInfo,
        rawSummaryData.referenceDate,
      )
        .then((res) => setAiSummary(res))
        .catch((err) => console.error(err))
        .finally(() => setIsAnalyzingSummary(false));

      aiPromises.push(summaryPromise);
    } else {
      setAiSummary(null);
      setIsAnalyzingSummary(false);
    }

    await Promise.all(aiPromises);
  };

  if (!mounted) return null;

  const currentDateTime = new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

  return (
    // 🌟 เปลี่ยน p-6 เป็น p-3 sm:p-6 (ลดขอบมือถือ)
    <div className="min-h-screen bg-[#0e1116] text-zinc-100 p-3 sm:p-6 font-sans">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            {/* 🌟 เพิ่ม truncate ให้ชื่อโปรเจกต์ไม่ล้นจอมือถือ */}
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate max-w-[200px] sm:max-w-full">
              {projectInfo?.name || "กำลังโหลด..."}
            </h1>
            {projectInfo?.code && (
              <span className="bg-blue-900/50 text-blue-400 text-[10px] sm:text-xs px-2 py-1 rounded border border-blue-800/50">
                {projectInfo.code}
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-xs text-zinc-400 mt-1">
            อัปเดตล่าสุด: {currentDateTime} น.
          </p>
        </div>
      </div>

      {/* 🌟 เปลี่ยน grid-cols-1 เป็น grid-cols-2 (ให้มือถือเรียง 2 การ์ดต่อแถว) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-[#161b22] border border-zinc-800/80 p-4 sm:p-5 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] sm:text-sm text-zinc-400">
              ความคืบหน้าโครงการ
            </h3>
            <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
          </div>
          <div>
            {isLoading ? (
              <div className="h-6 sm:h-8 w-16 sm:w-20 bg-zinc-800 animate-pulse rounded"></div>
            ) : (
              // 🌟 ปรับขนาด Text
              <span className="text-xl sm:text-3xl font-bold text-white">
                {projectProgress ?? 0}%
              </span>
            )}
            <div className="w-full bg-zinc-800 rounded-full h-1 sm:h-1.5 mt-2">
              <div
                className="bg-blue-600 h-1 sm:h-1.5 rounded-full transition-all duration-1000"
                style={{
                  width: `${isLoading ? 0 : Math.min(100, projectProgress ?? 0)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-[#161b22] border border-zinc-800/80 p-4 sm:p-5 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[10px] sm:text-sm text-zinc-400">
              งบประมาณที่ใช้ไป
            </h3>
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-sm"></div>{" "}
          </div>
          <div>
            <div className="flex items-baseline gap-1 sm:gap-2 mb-2">
              {/* 🌟 ปรับขนาด Text และเพิ่ม truncate กันตัวเลขยาวทะลุกล่อง */}
              <span className="text-lg sm:text-3xl font-bold text-white truncate">
                {(expenses ?? 0).toLocaleString()}
              </span>
              <span className="text-[9px] sm:text-sm text-zinc-400">บาท.</span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-zinc-500 mb-2 line-clamp-1">
              จากงบรวม {projectInfo?.budget?.toLocaleString() ?? 0} บาท
              (ใช้ไปแล้ว{" "}
              {projectInfo?.budget
                ? (((expenses ?? 0) / projectInfo.budget) * 100).toFixed(1)
                : 0}
              %)
            </p>
            <div className="w-full bg-zinc-800 rounded-full h-1 sm:h-1.5 flex overflow-hidden">
              <div
                className="bg-orange-500 h-1 sm:h-1.5 transition-all duration-1000"
                style={{
                  width: `${
                    projectInfo?.budget
                      ? Math.min(
                          100,
                          ((expenses ?? 0) / projectInfo.budget) * 100,
                        )
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        <StatusBoard
          todo={counts.todo}
          progress={counts.progress}
          done={counts.done}
          delay={counts.delay}
          isLoading={isLoading}
        />

        <RiskScoreDashboard
          actualProgress={projectProgress ?? 0}
          plannedProgress={planProgress ?? 0}
          budgetSpentPercent={
            projectInfo?.budget
              ? ((expenses ?? 0) / projectInfo.budget) * 100
              : 0
          }
          delayTasksCount={counts.delay}
        />
      </div>

      {!hasAnalyzed ? (
        <div className="mb-6 flex flex-col items-center justify-center p-6 sm:p-10 bg-[#161b22] border border-zinc-800/80 rounded-xl space-y-4">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/10">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 animate-pulse" />
          </div>
          <div className="text-center max-w-sm">
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">
              สรุปภาพรวมและวิเคราะห์ความเสี่ยง
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              ให้ AI อัจฉริยะช่วยประมวลผลข้อมูลโครงการ งบประมาณ และความคืบหน้า
              เพื่อค้นหางานที่ต้องจัดการด่วน
            </p>
          </div>
          <Button
            color="primary"
            className="font-bold shadow-lg mt-2 w-full sm:w-auto"
            onPress={handleRunAI}
            startContent={<Sparkles size={18} />}
            isDisabled={isLoading}
          >
            วิเคราะห์โครงการด้วย AI ทันที
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="w-full">
            <ActionRequiredList
              isAnalyzing={isAnalyzing}
              aiActions={aiActions}
            />
          </div>

          <div className="w-full">
            <ExecutiveSummary
              isAnalyzing={isAnalyzingSummary}
              summaryData={aiSummary}
            />
          </div>
        </div>
      )}

      {/* 🌟 กล่องมีเดีย: ย่อความสูงลงนิดนึงเวลาเปิดมือถือ h-[350px] sm:h-[400px] */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#161b22] border border-zinc-800/80 rounded-xl p-4 sm:p-5 flex flex-col h-[350px] sm:h-[400px]">
          <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2 mb-4 text-purple-400">
            <Video className="w-4 h-4" /> อัปเดตล่าสุด (360° View)
          </h2>
          <div className="flex-1 overflow-hidden">
            <ReadOnlyMapping360
              projectId={Number(projectId)}
              organizationId={Number(organizationId || 0)}
            />
          </div>
        </div>

        <div className="bg-[#161b22] border border-zinc-800/80 rounded-xl p-4 sm:p-5 flex flex-col h-[350px] sm:h-[400px]">
          <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2 mb-4 text-emerald-400">
            <Video className="w-4 h-4" /> สถานะล่าสุด (Live View)
          </h2>
          <div className="flex-1 overflow-hidden">
            <ReadOnlyLiveView projectId={Number(projectId)} />
          </div>
        </div>
      </div>
    </div>
  );
}
