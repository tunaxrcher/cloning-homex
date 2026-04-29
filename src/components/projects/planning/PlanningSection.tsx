"use client";

import { useState, useEffect } from "react";
import GanttView from "./GanttView";
import CalendarView from "./CalendarView";
import WorkloadView from "./WorkloadView";
import { getPlanningData, getProjectStart } from "@/lib/actions/actionPlanning";

export default function PlanningSection({
  projectId,
  organizationId,
  currentUserId,
}: {
  projectId: number;
  organizationId: number;
  currentUserId: number;
}) {
  const [view, setView] = useState<"gantt" | "calendar" | "workload">("gantt");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [projectStart, setProjectStart] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [planningRes, projectStartRes] = await Promise.all([
        getPlanningData(projectId),
        getProjectStart(projectId),
      ]);

      setData(planningRes.data || []);
      setProjectStart(projectStartRes);

      setLoading(false);
    };

    fetchData();
  }, [projectId]);

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-default-700 dark:text-white">
          แผนงาน VS ความคืบหน้าจริง
        </h2>

        <div className="flex bg-default-100 dark:bg-zinc-800 rounded-xl p-1 text-sm">
          <button
            onClick={() => setView("gantt")}
            className={`px-3 py-1 rounded-lg ${view === "gantt" ? "bg-primary text-white" : ""}`}
          >
            Gantt
          </button>
          {/* <button
            onClick={() => setView("gantt")}
            className={`px-3 py-1 rounded-lg transition ${view === "gantt"
              ? "bg-primary text-white"
              : "text-default-500 hover:bg-default-200 dark:hover:bg-zinc-700"
              }`}
          >
            Gantt
          </button> */}

          <button
            onClick={() => setView("calendar")}
            className={`px-3 py-1 rounded-lg ${view === "calendar" ? "bg-primary text-white" : ""}`}
          >
            Calendar
          </button>

          <button
            onClick={() => setView("workload")}
            className={`px-3 py-1 rounded-lg ${view === "workload" ? "bg-primary text-white" : ""}`}
          >
            Workload
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="p-10 text-center text-default-500">
          กำลังโหลดแผนงาน...
        </div>
      ) : (
        <>
          {view === "gantt" && <GanttView data={data} projectId={projectId} projectStart={projectStart} />}
          {view === "calendar" && <CalendarView data={data} projectStart={projectStart} />}
          {view === "workload" && <WorkloadView data={data} projectStart={projectStart} />}
        </>
      )}
    </div>
  );
}