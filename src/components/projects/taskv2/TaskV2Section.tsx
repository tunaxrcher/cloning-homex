"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Search } from "lucide-react";
import {
  Button,
  Input,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import type { TabTask, TaskV2SectionProps, TaskV2AIResponse } from "@/lib/type";
import { toast } from "react-toastify";
import { updateTaskStatus, updateMainTask, toggleSubtaskStatus, startTaskV2, submitTaskV2 } from "@/lib/actions/actionProject";
import { reorderSubtasks, editSubtaskName, replaceTaskV2AiData, updateTaskV2Info } from "@/lib/actions/actionTaskV2";
import { addMaterialToProcurement } from "@/lib/actions/actionProcurementSuggestion";
import MainTaskCard from "../MainTaskCard";
import TaskFilterTabs from "../TaskFilterTabs";
import { EmptyStateCard } from "../EmptyStateCard";
import { DropColumn } from "../DropColumn";
import CreateTaskV2Modal from "./CreateTaskV2Modal";
import TaskV2DetailDialog from "./TaskV2DetailDialog";

const TaskV2Section = ({
  tasks,
  setTasks,
  projectInfo,
  organizationId,
  currentUserId,
  isCustomer,
  projectMembers,
  contractors,
}: TaskV2SectionProps) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [view, setView] = useState<"card" | "board">("card");
  const [activeTab, setActiveTab] = useState<TabTask>("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Detail dialog state
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setVisibleCount(10);
  }, [activeTab, debouncedQ, view]);

  useEffect(() => {
    if (view === "board") {
      setActiveTab("all");
      setQ("");
    }
  }, [view]);

  const selected = useMemo(
    () => tasks.find((t) => t.id === selectedId) || null,
    [tasks, selectedId]
  );

  // Build aiData from task fields directly (no server call needed)
  const aiData = useMemo((): TaskV2AIResponse | null => {
    if (!selected) return null;
    const hasAiFields = selected.estimatedBudget || selected.aiRisks;
    const hasDetails = (selected.details || []).length > 0;
    if (!hasAiFields && !hasDetails) return null;

    let risks = [];
    try { risks = selected.aiRisks ? JSON.parse(selected.aiRisks) : []; } catch { risks = []; }

    let materials = [];
    try { materials = selected.aiMaterials ? JSON.parse(selected.aiMaterials) : []; } catch { materials = []; }

    const checklist = (selected.details || []).map((d: any) => ({
      id: d.id,
      name: d.detailName || "",
      progressPercent: d.weightPercent || 0,
      checked: d.status === true,
      finishActual: d.finishActual || null,
    }));

    return {
      costEstimation: {
        totalEstimate: Number(selected.estimatedBudget) || 0,
        breakdown: {
          materialPercent: selected.aiMaterialPercent ?? 0,
          materialCost: Number(selected.aiMaterialCost) || 0,
          laborPercent: selected.aiLaborPercent ?? 0,
          laborCost: Number(selected.aiLaborCost) || 0,
          machineryPercent: selected.aiMachineryPercent ?? 0,
          machineryCost: Number(selected.aiMachineryCost) || 0,
        },
      },
      durationEstimate: {
        totalDays: selected.estimatedDurationDays ?? 0,
        assumptions: selected.aiDurationAssumptions || "",
      },
      risks,
      materials,
      checklist,
      phase: selected.phase || "",
    };
  }, [selected]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      let matchTab = false;
      if (activeTab === "all") matchTab = true;
      else if (activeTab === "user")
        matchTab = Number(t.createdById) === Number(currentUserId);
      else matchTab = (t.status || "").toUpperCase() === activeTab.toUpperCase();

      const matchQ =
        debouncedQ === "" ||
        (t.taskName || "").toLowerCase().includes(debouncedQ.toLowerCase());
      return matchTab && matchQ;
    });
  }, [tasks, activeTab, debouncedQ, currentUserId]);

  const displayedTasks = useMemo(
    () => filteredTasks.slice(0, visibleCount),
    [filteredTasks, visibleCount]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisibleCount((prev) => prev + 10);
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [observerTarget, displayedTasks.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  const handleSelectTask = useCallback((id: number) => {
    setSelectedId(id);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handleChecklistChange = useCallback(
    async (checklist: any[], toggledIndex: number) => {
      if (!selected) return;

      const subtask = (selected.details || [])[toggledIndex];
      if (!subtask) return;

      const newStatus = checklist[toggledIndex]?.checked ?? false;

      const totalItems = checklist.length;
      const checkedItems = checklist.filter((c) => c.checked).length;
      const progress =
        totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

      // Optimistic UI update (progress + details in one call)
      const newTaskStatus = progress > 0 ? "PROGRESS" : "TODO";
      setTasks((prev: any[]) =>
        prev.map((t) =>
          t.id === selected.id
            ? {
                ...t,
                progressPercent: progress,
                status: newTaskStatus,
                details: (t.details || []).map((d: any, i: number) =>
                  checklist[i]
                    ? {
                        ...d,
                        status: checklist[i].checked,
                        finishActual: checklist[i].checked
                          ? d.finishActual || new Date().toISOString()
                          : null,
                      }
                    : d
                ),
              }
            : t
        )
      );

      // Persist to DB + create/delete feed post
      try {
        const res = await toggleSubtaskStatus(subtask.id, newStatus, selected.coverImageUrl || undefined);
        if (!res.success) throw new Error("อัปเดตไม่สำเร็จ");

        await updateMainTask(selected.id, {
          progressPercent: progress,
          status: newTaskStatus,
        });
      } catch {
        toast.error("อัปเดตสถานะไม่สำเร็จ");
        // Revert optimistic update
        setTasks((prev: any[]) =>
          prev.map((t) =>
            t.id === selected.id
              ? {
                  ...t,
                  progressPercent: selected.progressPercent,
                  status: selected.status,
                  details: selected.details,
                }
              : t
          )
        );
      }
    },
    [selected, setTasks]
  );

  const handleReorderChecklist = useCallback(
    async (reordered: any[]) => {
      if (!selected) return;

      // Optimistic UI: update details order
      const reorderedDetails = reordered.map((item: any, i: number) => {
        const detail = (selected.details || []).find((d: any) => d.id === item.id);
        return detail ? { ...detail, sortOrder: i } : detail;
      }).filter(Boolean);

      setTasks((prev: any[]) =>
        prev.map((t) =>
          t.id === selected.id ? { ...t, details: reorderedDetails } : t
        )
      );

      // Persist to DB
      const ids = reordered.map((item: any) => item.id).filter(Boolean);
      if (ids.length > 0) {
        const res = await reorderSubtasks(ids);
        if (!res.success) {
          toast.error("จัดเรียงไม่สำเร็จ");
          setTasks((prev: any[]) =>
            prev.map((t) =>
              t.id === selected.id ? { ...t, details: selected.details } : t
            )
          );
        }
      }
    },
    [selected, setTasks]
  );

  const handleEditSubtask = useCallback(
    async (subtaskId: number, newName: string) => {
      if (!selected) return;

      // Optimistic UI
      setTasks((prev: any[]) =>
        prev.map((t) =>
          t.id === selected.id
            ? {
                ...t,
                details: (t.details || []).map((d: any) =>
                  d.id === subtaskId ? { ...d, detailName: newName } : d
                ),
              }
            : t
        )
      );

      // Persist to DB
      const res = await editSubtaskName(subtaskId, newName);
      if (!res.success) {
        toast.error("แก้ไขชื่อไม่สำเร็จ");
        setTasks((prev: any[]) =>
          prev.map((t) =>
            t.id === selected.id ? { ...t, details: selected.details } : t
          )
        );
      }
    },
    [selected, setTasks]
  );

  const handleStartTask = useCallback(
    async (startDate: string) => {
      if (!selected) return;
      const res = await startTaskV2(selected.id, startDate);
      if (res.success) {
        setTasks((prev: any[]) =>
          prev.map((t) =>
            t.id === selected.id
              ? { ...t, startActual: startDate, status: "PROGRESS" }
              : t
          )
        );
        toast.success("เริ่มงานเรียบร้อย");
      } else {
        toast.error(res.message || "เริ่มงานไม่สำเร็จ");
      }
    },
    [selected, setTasks]
  );

  const handleSubmitTask = useCallback(
    async (finishDate: string) => {
      if (!selected) return;
      const res = await submitTaskV2(selected.id, finishDate);
      if (res.success) {
        setTasks((prev: any[]) =>
          prev.map((t) =>
            t.id === selected.id
              ? { ...t, finishActual: finishDate, status: "DONE", progressPercent: 100 }
              : t
          )
        );
        toast.success("ส่งงานเรียบร้อย");
      } else {
        toast.error(res.message || "ส่งงานไม่สำเร็จ");
      }
    },
    [selected, setTasks]
  );

  const handleBudgetChange = useCallback(
    (newBudget: number) => {
      if (!selected) return;
      setTasks((prev: any[]) =>
        prev.map((t) =>
          t.id === selected.id ? { ...t, budget: newBudget } : t
        )
      );
    },
    [selected, setTasks]
  );

  const handleDeleteTask = useCallback(async () => {
    if (!selected) return;
    const res = await updateTaskStatus(selected.id, "DELETED");
    if (res.success) {
      setTasks((prev: any[]) => prev.filter((t) => t.id !== selected.id));
      setSelectedId(null);
      toast.success("ลบงานเรียบร้อย");
    } else {
      toast.error(res.error || "ลบไม่สำเร็จ");
    }
  }, [selected, setTasks]);

  const handleAddToProcurement = useCallback(
    async (material: any): Promise<boolean> => {
      if (!selected) return false;
      const res = await addMaterialToProcurement({
        materialName: material.spec,
        specification: material.spec,
        quantity: material.quantity,
        unit: material.unit,
        unitPrice: material.unitPrice,
        totalPrice: material.totalPrice,
        taskId: selected.id,
        projectId: Number(projectInfo.id),
        organizationId,
      });
      if (!res.success) {
        toast.error(res.message || "เพิ่มไม่สำเร็จ");
        return false;
      }
      return true;
    },
    [selected, projectInfo.id, organizationId]
  );

  const handleReanalyze = useCallback(
    async (aiData: any) => {
      if (!selected) return;
      const res = await replaceTaskV2AiData(
        selected.id,
        Number(projectInfo.id),
        organizationId,
        aiData
      );
      if (!res.success) throw new Error(res.message || "บันทึกไม่สำเร็จ");

      // Optimistic: refresh tasks data
      setTasks((prev: any[]) =>
        prev.map((t) =>
          t.id === selected.id
            ? {
                ...t,
                estimatedBudget: aiData.costEstimation.totalEstimate,
                aiMaterialPercent: aiData.costEstimation.breakdown.materialPercent,
                aiMaterialCost: aiData.costEstimation.breakdown.materialCost,
                aiLaborPercent: aiData.costEstimation.breakdown.laborPercent,
                aiLaborCost: aiData.costEstimation.breakdown.laborCost,
                aiMachineryPercent: aiData.costEstimation.breakdown.machineryPercent,
                aiMachineryCost: aiData.costEstimation.breakdown.machineryCost,
                estimatedDurationDays: aiData.durationEstimate.totalDays,
                aiDurationAssumptions: aiData.durationEstimate.assumptions,
                aiRisks: JSON.stringify(aiData.risks),
                aiMaterials: JSON.stringify(aiData.materials),
                phase: aiData.phase,
                progressPercent: 0,
                status: "TODO",
                details: aiData.checklist.map((c: any, i: number) => ({
                  id: Date.now() + i,
                  detailName: c.name,
                  weightPercent: c.progressPercent,
                  status: false,
                  sortOrder: i,
                  finishActual: null,
                })),
              }
            : t
        )
      );
    },
    [selected, setTasks, projectInfo.id, organizationId]
  );

  const handleUpdateTaskInfo = useCallback(
    async (data: {
      taskName?: string;
      aiRefDescription?: string | null;
      aiRefImages?: string[] | null;
      phase?: string | null;
      startPlanned?: string | null;
      finishPlanned?: string | null;
    }) => {
      if (!selected) return;
      const res = await updateTaskV2Info(selected.id, data);
      if (!res.success) throw new Error(res.message || "อัปเดตไม่สำเร็จ");

      // Optimistic update
      setTasks((prev: any[]) =>
        prev.map((t) => {
          if (t.id !== selected.id) return t;
          const updated = { ...t };
          if (data.taskName !== undefined) updated.taskName = data.taskName;
          if (data.aiRefDescription !== undefined) updated.aiRefDescription = data.aiRefDescription;
          if (data.aiRefImages !== undefined) updated.aiRefImages = data.aiRefImages ? JSON.stringify(data.aiRefImages) : null;
          if (data.phase !== undefined) updated.phase = data.phase;
          if (data.startPlanned !== undefined) updated.startPlanned = data.startPlanned;
          if (data.finishPlanned !== undefined) updated.finishPlanned = data.finishPlanned;
          return updated;
        })
      );
      toast.success("อัปเดตข้อมูลสำเร็จ");
    },
    [selected, setTasks]
  );

  const handleDragEnd = useCallback(
    async (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over) return;
      const taskId = active.id as number;
      const newStatus = over.id as string;
      const taskToUpdate = tasks.find((t) => t.id === taskId);
      if (!taskToUpdate || taskToUpdate.status === newStatus) return;

      const newProgress =
        newStatus === "DONE" ? 100 : taskToUpdate.progressPercent;

      setTasks((prev: any[]) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: newStatus, progressPercent: newProgress }
            : t
        )
      );

      try {
        const res = await updateTaskStatus(taskId, newStatus);
        if (!res.success) throw new Error(res.error || "บันทึกไม่สำเร็จ");
        if (newStatus === "DONE") {
          await updateMainTask(taskId, { progressPercent: 100 });
        }
        toast.success(`เปลี่ยนสถานะงานเป็น ${newStatus} แล้ว`);
      } catch {
        toast.error("อัปเดตสถานะไม่สำเร็จ");
        setTasks((prev: any[]) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: taskToUpdate.status,
                  progressPercent: taskToUpdate.progressPercent,
                }
              : t
          )
        );
      }
    },
    [tasks, setTasks]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold">Tasks</h2>
          <p className="text-default-500 text-xs sm:text-sm">
            ติดตามรายการงาน (AI-Powered)
          </p>
        </div>
        <div className="w-full md:w-auto flex items-center gap-2">
          <div className="flex bg-default-100 p-1 rounded-xl shrink-0">
            <Button
              size="sm"
              variant={view === "card" ? "solid" : "light"}
              onPress={() => setView("card")}
            >
              Card
            </Button>
            <Button
              size="sm"
              variant={view === "board" ? "solid" : "light"}
              onPress={() => setView("board")}
            >
              Board
            </Button>
          </div>
          {!isCustomer && (
            <Button
              onPress={onOpen}
              color="primary"
              radius="full"
              className="font-bold shrink-0 gradientButton"
            >
              + สร้าง Task
            </Button>
          )}
        </div>
      </div>

      <CreateTaskV2Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        projectId={Number(projectInfo.id)}
        organizationId={organizationId}
        currentUserId={currentUserId}
        projectCode={projectInfo.code}
      />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="overflow-x-auto scrollbar-hide shrink-0">
            <TaskFilterTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          <Input
            placeholder="ค้นหา..."
            value={q}
            onValueChange={setQ}
            isClearable
            size="sm"
            startContent={<Search size={16} />}
            className="w-full"
          />
        </div>

        {filteredTasks.length === 0 ? (
          <EmptyStateCard onOpen={onOpen} />
        ) : (
          <>
            {view === "card" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {displayedTasks.map((t) => (
                  <MainTaskCard
                    key={t.id}
                    task={t}
                    onSelect={handleSelectTask}
                  />
                ))}
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 w-full min-w-0">
                    <DropColumn
                      status="TODO"
                      tasks={filteredTasks.filter((t) => t.status === "TODO")}
                      onTaskClick={handleSelectTask}
                    />
                    <DropColumn
                      status="PROGRESS"
                      tasks={filteredTasks.filter(
                        (t) => t.status === "PROGRESS"
                      )}
                      onTaskClick={handleSelectTask}
                    />
                    <DropColumn
                      status="DONE"
                      tasks={filteredTasks.filter((t) => t.status === "DONE")}
                      onTaskClick={handleSelectTask}
                    />
                  </div>
                </DndContext>
              </div>
            )}
          </>
        )}
      </div>

      {visibleCount < filteredTasks.length && filteredTasks.length > 0 && (
        <div ref={observerTarget} className="flex justify-center py-10">
          <Spinner color="primary" />
        </div>
      )}

      <TaskV2DetailDialog
        task={selected}
        aiData={aiData}
        isOpen={!!selected}
        onClose={handleCloseDialog}
        projectInfo={projectInfo}
        onChecklistChange={handleChecklistChange}
        onReorderChecklist={handleReorderChecklist}
        onEditSubtask={handleEditSubtask}
        onAddToProcurement={handleAddToProcurement}
        onStartTask={handleStartTask}
        onSubmitTask={handleSubmitTask}
        onBudgetChange={handleBudgetChange}
        onDeleteTask={handleDeleteTask}
        onReanalyze={handleReanalyze}
        onUpdateTaskInfo={handleUpdateTaskInfo}
      />
    </div>
  );
};

export default TaskV2Section;
