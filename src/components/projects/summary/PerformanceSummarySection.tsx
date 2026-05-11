"use client";

import { useMemo, useState, useCallback } from "react";
import {
  CheckCircle,
  Clock,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Users,
  Medal,
  Trophy,
  Award,
  User as UserIcon,
} from "lucide-react";
import { Avatar, Chip, Progress, Tooltip } from "@heroui/react";
import TaskV2DetailDialog from "../taskv2/TaskV2DetailDialog";

interface PerformanceSummarySectionProps {
  tasks: any[];
  projectMembers: any[];
  projectInfo: { id: string; code: string; name: string };
}

interface MemberSummary {
  id: number;
  displayName: string;
  avatar?: string;
  totalTasks: number;
  doneTasks: number;
  progressTasks: number;
  todoTasks: number;
  completionRate: number;
  taskDetails: {
    id: number;
    taskName: string;
    status: string;
    progressPercent: number;
    coverImageUrl?: string;
    assignees: { id: number; displayName: string }[];
    subtotalDone: number;
    subtotalAll: number;
  }[];
}

const RANK_CONFIG = [
  { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  { icon: Medal, color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/30" },
  { icon: Award, color: "text-amber-600", bg: "bg-amber-600/10", border: "border-amber-600/30" },
];

export default function PerformanceSummarySection({
  tasks,
  projectMembers,
  projectInfo,
}: PerformanceSummarySectionProps) {
  const [expandedMemberIds, setExpandedMemberIds] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState<
    "all" | "DONE" | "PROGRESS" | "TODO"
  >("all");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const memberSummaries: MemberSummary[] = useMemo(() => {
    const memberMap = new Map<number, MemberSummary>();

    // Build from projectMembers so we include members even if they have 0 tasks
    for (const m of projectMembers) {
      memberMap.set(m.id, {
        id: m.id,
        displayName: m.displayName || `User #${m.id}`,
        avatar: m.avatar || undefined,
        totalTasks: 0,
        doneTasks: 0,
        progressTasks: 0,
        todoTasks: 0,
        completionRate: 0,
        taskDetails: [],
      });
    }

    // Walk through tasks and assign to members
    for (const task of tasks) {
      const assignees: { id: number; displayName: string }[] =
        task.assignees || [];

      if (assignees.length === 0) continue;

      for (const assignee of assignees) {
        if (!memberMap.has(assignee.id)) {
          memberMap.set(assignee.id, {
            id: assignee.id,
            displayName: assignee.displayName || `User #${assignee.id}`,
            totalTasks: 0,
            doneTasks: 0,
            progressTasks: 0,
            todoTasks: 0,
            completionRate: 0,
            taskDetails: [],
          });
        }

        const member = memberMap.get(assignee.id)!;
        member.totalTasks += 1;

        const status = (task.status || "").toUpperCase();
        if (status === "DONE") member.doneTasks += 1;
        else if (status === "PROGRESS") member.progressTasks += 1;
        else if (status === "TODO") member.todoTasks += 1;

        const subtotalDone = (task.details || []).filter(
          (d: any) => d.status === true
        ).length;
        const subtotalAll = (task.details || []).length;

        member.taskDetails.push({
          id: task.id,
          taskName: task.taskName || "ไม่มีชื่องาน",
          status: task.status,
          progressPercent: task.progressPercent || 0,
          coverImageUrl: task.coverImageUrl,
          assignees,
          subtotalDone,
          subtotalAll,
        });
      }
    }

    // Calculate completion rate
    for (const member of memberMap.values()) {
      member.completionRate =
        member.totalTasks > 0
          ? Math.round((member.doneTasks / member.totalTasks) * 100)
          : 0;
    }

    // Sort by doneTasks desc, then by totalTasks desc
    return Array.from(memberMap.values()).sort(
      (a, b) => b.doneTasks - a.doneTasks || b.totalTasks - a.totalTasks
    );
  }, [tasks, projectMembers]);

  // Auto-expand top 3 on first render
  useMemo(() => {
    const top2Ids = memberSummaries
      .filter((m) => m.totalTasks > 0)
      .slice(0, 2)
      .map((m) => m.id);
    setExpandedMemberIds(new Set(top2Ids));
  }, [memberSummaries]);

  const toggleExpand = (id: number) => {
    setExpandedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setStatusFilter("all");
  };

  // Overall stats
  const overall = useMemo(() => {
    const uniqueMembers = memberSummaries.filter((m) => m.totalTasks > 0).length;
    const totalDone = memberSummaries.reduce((s, m) => s + m.doneTasks, 0);
    const totalTasks = memberSummaries.reduce((s, m) => s + m.totalTasks, 0);
    return { uniqueMembers, totalDone, totalTasks };
  }, [memberSummaries]);

  // Selected full task for dialog
  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  );

  // Build aiData from selected task (same logic as TaskV2Section)
  const aiData = useMemo(() => {
    if (!selectedTask) return null;
    const hasAiFields = selectedTask.estimatedBudget || selectedTask.aiRisks;
    const hasDetails = (selectedTask.details || []).length > 0;
    if (!hasAiFields && !hasDetails) return null;

    let risks: any[] = [];
    try { risks = selectedTask.aiRisks ? JSON.parse(selectedTask.aiRisks) : []; } catch { risks = []; }

    let materials: any[] = [];
    try { materials = selectedTask.aiMaterials ? JSON.parse(selectedTask.aiMaterials) : []; } catch { materials = []; }

    const checklist = (selectedTask.details || []).map((d: any) => ({
      id: d.id,
      name: d.detailName || "",
      progressPercent: d.weightPercent || 0,
      checked: d.status === true,
      finishActual: d.finishActual || null,
    }));

    return {
      costEstimation: {
        totalEstimate: Number(selectedTask.estimatedBudget) || 0,
        breakdown: {
          materialPercent: selectedTask.aiMaterialPercent ?? 0,
          materialCost: Number(selectedTask.aiMaterialCost) || 0,
          laborPercent: selectedTask.aiLaborPercent ?? 0,
          laborCost: Number(selectedTask.aiLaborCost) || 0,
          machineryPercent: selectedTask.aiMachineryPercent ?? 0,
          machineryCost: Number(selectedTask.aiMachineryCost) || 0,
        },
      },
      durationEstimate: {
        totalDays: selectedTask.estimatedDurationDays ?? 0,
        assumptions: selectedTask.aiDurationAssumptions || "",
      },
      risks,
      materials,
      checklist,
      phase: selectedTask.phase || "",
    };
  }, [selectedTask]);

  const handleCloseDialog = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  // No-op handlers for read-only dialog
  const noop = useCallback(() => {}, []);
  const noopAsync = useCallback(async () => {}, []);
  const noopReturn = useCallback(async () => false, []);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "DONE":
        return "success";
      case "PROGRESS":
        return "primary";
      case "TODO":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case "DONE":
        return "เสร็จแล้ว";
      case "PROGRESS":
        return "กำลังทำ";
      case "TODO":
        return "รอดำเนินการ";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">ผลงานรายบุคคล</h2>
        <p className="text-default-500 text-xs sm:text-sm mt-1">
          ดูภาพรวมผลงานของสมาชิกแต่ละคนในโปรเจกต์
        </p>
      </div>

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-default-100 dark:bg-zinc-800/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[11px] text-default-400 font-semibold uppercase">
              สมาชิกที่มีงาน
            </p>
            <p className="text-lg font-bold">{overall.uniqueMembers} คน</p>
          </div>
        </div>
        <div className="bg-default-100 dark:bg-zinc-800/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-[11px] text-default-400 font-semibold uppercase">
              งานที่เสร็จแล้ว (รวม)
            </p>
            <p className="text-lg font-bold text-success">
              {overall.totalDone}{" "}
              <span className="text-default-400 text-sm font-normal">
                / {overall.totalTasks}
              </span>
            </p>
          </div>
        </div>
        <div className="bg-default-100 dark:bg-zinc-800/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <ListChecks className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-[11px] text-default-400 font-semibold uppercase">
              อัตราความสำเร็จเฉลี่ย
            </p>
            <p className="text-lg font-bold text-warning">
              {overall.totalTasks > 0
                ? Math.round((overall.totalDone / overall.totalTasks) * 100)
                : 0}
              %
            </p>
          </div>
        </div>
      </div>

      {/* Member List */}
      {memberSummaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-default-50 dark:bg-zinc-800/30 rounded-2xl border-2 border-dashed border-default-200">
          <Users className="w-10 h-10 text-default-300 mb-3" />
          <p className="text-default-400 font-medium">
            ยังไม่มีสมาชิกในโปรเจกต์
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {memberSummaries.map((member, index) => {
            const isExpanded = expandedMemberIds.has(member.id);
            const filteredDetails =
              statusFilter === "all"
                ? member.taskDetails
                : member.taskDetails.filter(
                    (t) => t.status.toUpperCase() === statusFilter
                  );

            const rankConfig = index < 3 && member.totalTasks > 0 ? RANK_CONFIG[index] : null;
            const RankIcon = rankConfig?.icon;

            return (
              <div
                key={member.id}
                className={`rounded-2xl border overflow-hidden transition-all ${
                  rankConfig
                    ? `bg-default-50 dark:bg-zinc-800/50 ${rankConfig.border}`
                    : "bg-default-50 dark:bg-zinc-800/40 border-default-200 dark:border-zinc-700"
                }`}
              >
                {/* Member Row */}
                <button
                  onClick={() => toggleExpand(member.id)}
                  className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-default-100/50 dark:hover:bg-zinc-700/30 transition-colors text-left"
                >
                  {/* Rank Badge */}
                  {RankIcon ? (
                    <div className={`w-9 h-9 rounded-full ${rankConfig.bg} flex items-center justify-center shrink-0`}>
                      <RankIcon className={`w-5 h-5 ${rankConfig.color}`} />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-default-100 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-default-400">#{index + 1}</span>
                    </div>
                  )}

                  <Avatar
                    name={member.displayName}
                    size="sm"
                    className="shrink-0"
                    showFallback
                    src={member.avatar}
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm sm:text-base truncate">
                      {member.displayName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress
                        value={member.completionRate}
                        color={
                          member.completionRate === 100 ? "success" : "primary"
                        }
                        size="sm"
                        className="max-w-[140px] sm:max-w-[200px]"
                      />
                      <span className="text-xs text-default-400 font-medium shrink-0">
                        {member.completionRate}%
                      </span>
                    </div>
                  </div>

                  {/* Stat Badges */}
                  <div className="hidden sm:flex items-center gap-2">
                    <Tooltip content="เสร็จแล้ว" size="sm">
                      <Chip
                        size="sm"
                        variant="flat"
                        color="success"
                        startContent={
                          <CheckCircle className="w-3 h-3 ml-1" />
                        }
                      >
                        {member.doneTasks}
                      </Chip>
                    </Tooltip>
                    <Tooltip content="กำลังทำ" size="sm">
                      <Chip
                        size="sm"
                        variant="flat"
                        color="primary"
                        startContent={<Clock className="w-3 h-3 ml-1" />}
                      >
                        {member.progressTasks}
                      </Chip>
                    </Tooltip>
                    {/* <Chip size="sm" variant="flat" color="default">
                      {member.todoTasks}
                    </Chip> */}
                  </div>

                  {/* Mobile stat */}
                  <div className="flex sm:hidden items-center gap-1.5">
                    <span className="text-xs font-bold text-success">
                      {member.doneTasks}
                    </span>
                    <span className="text-default-300">/</span>
                    <span className="text-xs font-medium text-default-500">
                      {member.totalTasks}
                    </span>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-default-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-default-400 shrink-0" />
                  )}
                </button>

                {/* Expanded Task Detail */}
                {isExpanded && (
                  <div className="border-t border-default-200 dark:border-zinc-700">
                    {/* Status filter pills */}
                    <div className="flex items-center gap-2 p-3 sm:p-4 pb-2 overflow-x-auto">
                      {(
                        [
                          { key: "all", label: "ทั้งหมด" },
                          { key: "DONE", label: "เสร็จแล้ว" },
                          { key: "PROGRESS", label: "กำลังทำ" },
                          // { key: "TODO", label: "รอทำ" },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.key}
                          onClick={() => setStatusFilter(f.key)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                            statusFilter === f.key
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-default-100 dark:bg-zinc-700 text-default-600 dark:text-zinc-300 border-transparent hover:border-default-300"
                          }`}
                        >
                          {f.label}
                          {f.key !== "all" && (
                            <span className="ml-1 opacity-70">
                              (
                              {f.key === "DONE"
                                ? member.doneTasks
                                : f.key === "PROGRESS"
                                  ? member.progressTasks
                                  : member.todoTasks}
                              )
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Task List */}
                    <div className="px-3 sm:px-4 pb-4 space-y-2 max-h-[400px] overflow-y-auto">
                      {filteredDetails.length === 0 ? (
                        <div className="text-center py-8 text-default-400 text-sm">
                          ไม่มีงานในสถานะนี้
                        </div>
                      ) : (
                        filteredDetails.map((task) => (
                          <button
                            key={task.id}
                            onClick={() => setSelectedTaskId(task.id)}
                            className="w-full flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 rounded-xl border border-default-100 dark:border-zinc-700 hover:border-primary/40 hover:shadow-sm transition-all text-left cursor-pointer"
                          >
                            {/* Cover Image */}
                            {task.coverImageUrl ? (
                              <img
                                src={task.coverImageUrl}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-default-100 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                                <ListChecks className="w-4 h-4 text-default-400" />
                              </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {task.taskName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color={getStatusColor(task.status)}
                                  className="h-5"
                                >
                                  <span className="text-[10px]">
                                    {getStatusLabel(task.status)}
                                  </span>
                                </Chip>
                                {task.subtotalAll > 0 && (
                                  <span className="text-[11px] text-default-400">
                                    subtask {task.subtotalDone}/{task.subtotalAll}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Progress + Team/Solo */}
                            <div className="text-right shrink-0 flex flex-col items-end gap-1">
                              <span className="text-xs font-bold">
                                {task.progressPercent}%
                              </span>
                              {task.assignees.length > 1 ? (
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color="secondary"
                                  className="h-5"
                                  startContent={<Users className="w-3 h-3 ml-0.5" />}
                                >
                                  <span className="text-[10px]">ทีม ({task.assignees.length})</span>
                                </Chip>
                              ) : (
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color="default"
                                  className="h-5"
                                  startContent={<UserIcon className="w-3 h-3 ml-0.5" />}
                                >
                                  <span className="text-[10px]">Solo</span>
                                </Chip>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Dialog (same as งาน New) */}
      <TaskV2DetailDialog
        task={selectedTask}
        aiData={aiData}
        isOpen={!!selectedTask}
        onClose={handleCloseDialog}
        projectInfo={projectInfo}
        onChecklistChange={noop as any}
        onReorderChecklist={noop as any}
        onEditSubtask={noop as any}
        onAddToProcurement={noopReturn as any}
        onStartTask={noopAsync as any}
        onSubmitTask={noopAsync as any}
      />
    </div>
  );
}
