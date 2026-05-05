"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Progress,
  Button,
  Input,
  Avatar,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import {
  FileText,
  ShoppingCart,
  CheckSquare,
  Clock,
  CalendarDays,
  Wallet,
  Trash2,
  RefreshCw,
  Pencil,
  Check,
  X,
  Sparkles,
  DollarSign,
  AlertTriangle,
  UserPlus,
  Users,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import type {
  TaskV2DetailDialogProps,
  TaskV2ChecklistItem,
  TaskV2AIResponse,
} from "@/lib/type";
import { generateTaskV2Analysis } from "@/lib/ai/taskV2AI";
import { getOrgSetting } from "@/lib/actions/actionOrgSetting";
import { SETTING_KEYS } from "@/lib/settingKeys";
import TaskV2CardTab from "./TaskV2CardTab";
import TaskV2ProcurementTab from "./TaskV2ProcurementTab";
import TaskV2QCFieldTab from "./TaskV2QCFieldTab";
import TaskV2ActualBudgetTab from "./TaskV2ActualBudgetTab";
import TaskV2SubmitResultTab from "./TaskV2SubmitResultTab";
import DeleteTaskModal from "../DeleteTaskModal";

type V2Tab = "card" | "prpo" | "qcfield" | "actual_budget" | "submit_result";

const TaskV2DetailDialog = ({
  task,
  aiData,
  isOpen,
  onClose,
  projectInfo,
  onChecklistChange,
  onReorderChecklist,
  onEditSubtask,
  onAddToProcurement,
  onStartTask,
  onSubmitTask,
  onBudgetChange,
  onDeleteTask,
  onReanalyze,
  onUpdateTaskInfo,
  projectMembers,
  onAddAssignee,
  onRemoveAssignee,
}: TaskV2DetailDialogProps) => {
  const [activeTab, setActiveTab] = useState<V2Tab>("card");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // Inline edit: task name
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // Inline edit: phase
  const [isEditingPhase, setIsEditingPhase] = useState(false);
  const [editPhaseValue, setEditPhaseValue] = useState("");
  const [isSavingPhase, setIsSavingPhase] = useState(false);

  // Inline edit: planned dates
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editStartPlanned, setEditStartPlanned] = useState("");
  const [editFinishPlanned, setEditFinishPlanned] = useState("");
  const [isSavingDates, setIsSavingDates] = useState(false);

  // Re-analyze
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [reanalyzePreview, setReanalyzePreview] = useState<TaskV2AIResponse | null>(null);
  const [showReanalyzePreview, setShowReanalyzePreview] = useState(false);
  const [isSavingReanalyze, setIsSavingReanalyze] = useState(false);

  // Parse ref data from task
  const aiRefImages = useMemo(() => {
    if (!task?.aiRefImages) return [];
    try { return JSON.parse(task.aiRefImages); } catch { return []; }
  }, [task?.aiRefImages]);

  const aiRefDescription = task?.aiRefDescription || null;

  const handleConfirmDelete = async () => {
    if (!onDeleteTask) return;
    setIsDeletingTask(true);
    try {
      await onDeleteTask();
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeletingTask(false);
    }
  };

  // Inline edit: save task name
  const handleSaveName = async () => {
    if (!editNameValue.trim() || !onUpdateTaskInfo) return;
    setIsSavingName(true);
    try {
      await onUpdateTaskInfo({ taskName: editNameValue.trim() });
      setIsEditingName(false);
    } catch {
      toast.error("แก้ไขชื่อไม่สำเร็จ");
    } finally {
      setIsSavingName(false);
    }
  };

  // Inline edit: save phase
  const handleSavePhase = async () => {
    if (!onUpdateTaskInfo) return;
    setIsSavingPhase(true);
    try {
      await onUpdateTaskInfo({ phase: editPhaseValue.trim() || null });
      setIsEditingPhase(false);
    } catch {
      toast.error("แก้ไข Phase ไม่สำเร็จ");
    } finally {
      setIsSavingPhase(false);
    }
  };

  // Inline edit: save planned dates
  const handleSaveDates = async () => {
    if (!onUpdateTaskInfo) return;
    setIsSavingDates(true);
    try {
      await onUpdateTaskInfo({
        startPlanned: editStartPlanned || null,
        finishPlanned: editFinishPlanned || null,
      });
      setIsEditingDates(false);
    } catch {
      toast.error("แก้ไขวันที่ไม่สำเร็จ");
    } finally {
      setIsSavingDates(false);
    }
  };

  // Format date for display
  const formatDate = (d: any) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
    } catch { return "—"; }
  };

  // Format date for input[type=date]
  const toDateInputValue = (d: any) => {
    if (!d) return "";
    try {
      return new Date(d).toISOString().split("T")[0];
    } catch { return ""; }
  };

  // Re-analyze: run AI
  const handleReanalyze = async () => {
    if (!task) return;
    setIsReanalyzing(true);
    setShowReanalyzePreview(false);
    setReanalyzePreview(null);
    try {
      // Prepare images from S3 URLs → fetch and convert to base64
      let imagePayloads: { base64: string; mimeType: string }[] | undefined;
      if (aiRefImages.length > 0) {
        const results = await Promise.allSettled(
          aiRefImages.map(async (url: string) => {
            const res = await fetch(url);
            const blob = await res.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = "";
            bytes.forEach((b) => (binary += String.fromCharCode(b)));
            const base64 = btoa(binary);
            return { base64, mimeType: blob.type || "image/jpeg" };
          })
        );
        imagePayloads = results
          .filter((r): r is PromiseFulfilledResult<{ base64: string; mimeType: string }> => r.status === "fulfilled")
          .map((r) => r.value);
      }

      const customRolePrompt = await getOrgSetting(SETTING_KEYS.AI_TASK_ROLE_PROMPT);
      const result = await generateTaskV2Analysis(
        task.taskName || "",
        imagePayloads,
        aiRefDescription || undefined,
        customRolePrompt || undefined,
      );

      if (result) {
        setReanalyzePreview(result);
        setShowReanalyzePreview(true);
      } else {
        toast.error("AI วิเคราะห์ไม่สำเร็จ กรุณาลองใหม่");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการวิเคราะห์");
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Re-analyze: confirm save
  const handleConfirmReanalyze = async () => {
    if (!reanalyzePreview || !onReanalyze) return;
    setIsSavingReanalyze(true);
    try {
      await onReanalyze(reanalyzePreview);
      setShowReanalyzePreview(false);
      setReanalyzePreview(null);
      toast.success("บันทึกผลวิเคราะห์ใหม่สำเร็จ");
    } catch {
      toast.error("บันทึกไม่สำเร็จ");
    } finally {
      setIsSavingReanalyze(false);
    }
  };

  const handleChecklistToggle = useCallback(
    (index: number) => {
      if (!aiData?.checklist) return;
      const updated: TaskV2ChecklistItem[] = aiData.checklist.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      );
      onChecklistChange(updated, index);
    },
    [aiData, onChecklistChange]
  );

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "TODO":
        return "default";
      case "PROGRESS":
        return "primary";
      case "DONE":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case "TODO":
        return "To Do (รอเริ่มงาน)";
      case "PROGRESS":
        return "Doing (กำลังดำเนินการ)";
      case "DONE":
        return "Done (เสร็จแล้ว)";
      default:
        return status;
    }
  };

  const hasSubmitResult = !!(task?.submitNote || task?.submitImages);

  const tabs = [
    {
      key: "card" as V2Tab,
      label: "ข้อมูลการ์ด (Task Card)",
      icon: <FileText size={16} />,
    },
    {
      key: "prpo" as V2Tab,
      label: "ระบบจัดซื้อ (PR/PO)",
      icon: <ShoppingCart size={16} />,
    },
    {
      key: "qcfield" as V2Tab,
      label: "อัปเดตงาน (QC Field)",
      icon: <CheckSquare size={16} />,
    },
    {
      key: "actual_budget" as V2Tab,
      label: "งบประมาณจริง",
      icon: <Wallet size={16} />,
    },
    ...(hasSubmitResult
      ? [
          {
            key: "submit_result" as V2Tab,
            label: "ผลงาน",
            icon: <ClipboardCheck size={16} />,
          },
        ]
      : []),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setActiveTab("card");
        }
      }}
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      size="4xl"
      placement="center"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[92vh] md:max-h-[88vh] rounded-2xl mx-2 sm:mx-auto overflow-hidden",
        closeButton:
          "top-3 right-3 bg-default-100 hover:bg-default-200 z-50",
        body: "p-0",
      }}
    >
      <ModalContent className="flex flex-col overflow-hidden bg-[#0f1117] text-white">
        {task && (
          <ModalBody className="overflow-y-auto scrollbar-hide flex-1 mt-2">
            {/* ===== HEADER ===== */}
            <div className="p-4 sm:p-6 space-y-3 border-b border-zinc-800">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Phase (inline editable) */}
                  {isEditingPhase ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editPhaseValue}
                        onValueChange={setEditPhaseValue}
                        size="sm"
                        variant="bordered"
                        autoFocus
                        placeholder="เช่น Phase 1, งานโครงสร้าง..."
                        classNames={{
                          input: "text-xs text-white",
                          inputWrapper: "bg-zinc-900/80 border-zinc-600 h-7 min-h-7",
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSavePhase();
                          if (e.key === "Escape") setIsEditingPhase(false);
                        }}
                      />
                      <Button isIconOnly size="sm" color="success" variant="flat" onPress={handleSavePhase} isLoading={isSavingPhase} className="h-7 w-7 min-w-7">
                        <Check size={12} />
                      </Button>
                      <Button isIconOnly size="sm" color="danger" variant="flat" onPress={() => setIsEditingPhase(false)} className="h-7 w-7 min-w-7">
                        <X size={12} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                        <CalendarDays size={12} />
                        {aiData?.phase || task?.phase || "—"} / {projectInfo.code}
                      </p>
                      {onUpdateTaskInfo && (
                        <button
                          onClick={() => {
                            setEditPhaseValue(aiData?.phase || task?.phase || "");
                            setIsEditingPhase(true);
                          }}
                          className="p-0.5 rounded hover:bg-zinc-700/60 text-zinc-600 hover:text-zinc-300 transition-colors"
                          title="แก้ไข Phase"
                        >
                          <Pencil size={10} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Inline editable task name */}
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editNameValue}
                        onValueChange={setEditNameValue}
                        size="sm"
                        variant="bordered"
                        autoFocus
                        classNames={{
                          input: "text-lg font-bold text-white",
                          inputWrapper: "bg-zinc-900/80 border-zinc-600 h-10",
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveName();
                          if (e.key === "Escape") setIsEditingName(false);
                        }}
                      />
                      <Button isIconOnly size="sm" color="success" variant="flat" onPress={handleSaveName} isLoading={isSavingName}>
                        <Check size={14} />
                      </Button>
                      <Button isIconOnly size="sm" color="danger" variant="flat" onPress={() => setIsEditingName(false)}>
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold leading-tight break-words">
                        {task.taskName || "Untitled"}
                      </h2>
                      {onUpdateTaskInfo && (
                        <button
                          onClick={() => {
                            setEditNameValue(task.taskName || "");
                            setIsEditingName(true);
                          }}
                          className="p-1 rounded-md hover:bg-zinc-700/60 text-zinc-600 hover:text-zinc-300 transition-colors"
                          title="แก้ไขชื่องาน"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Planned dates (inline editable) */}
                  {isEditingDates ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-500">เริ่ม:</span>
                        <input
                          type="date"
                          value={editStartPlanned}
                          onChange={(e) => setEditStartPlanned(e.target.value)}
                          className="bg-zinc-900/80 border border-zinc-600 text-xs text-white rounded px-1.5 py-0.5 outline-none focus:border-primary"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-500">เสร็จ:</span>
                        <input
                          type="date"
                          value={editFinishPlanned}
                          onChange={(e) => setEditFinishPlanned(e.target.value)}
                          className="bg-zinc-900/80 border border-zinc-600 text-xs text-white rounded px-1.5 py-0.5 outline-none focus:border-primary"
                        />
                      </div>
                      <Button isIconOnly size="sm" color="success" variant="flat" onPress={handleSaveDates} isLoading={isSavingDates} className="h-6 w-6 min-w-6">
                        <Check size={12} />
                      </Button>
                      <Button isIconOnly size="sm" color="danger" variant="flat" onPress={() => setIsEditingDates(false)} className="h-6 w-6 min-w-6">
                        <X size={12} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-zinc-500">
                        แผน: {formatDate(task.startPlanned)} – {formatDate(task.finishPlanned)} &middot; {projectInfo.name}
                      </p>
                      {onUpdateTaskInfo && (
                        <button
                          onClick={() => {
                            setEditStartPlanned(toDateInputValue(task.startPlanned));
                            setEditFinishPlanned(toDateInputValue(task.finishPlanned));
                            setIsEditingDates(true);
                          }}
                          className="p-0.5 rounded hover:bg-zinc-700/60 text-zinc-600 hover:text-zinc-300 transition-colors"
                          title="แก้ไขวันที่แผน"
                        >
                          <Pencil size={10} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Chip
                    color={getStatusColor(task.status)}
                    variant="flat"
                    size="sm"
                    startContent={<Clock size={12} />}
                  >
                    {getStatusLabel(task.status)}
                  </Chip>
                  {onReanalyze && (
                    <Button
                      size="sm"
                      color="secondary"
                      variant="flat"
                      onPress={handleReanalyze}
                      isLoading={isReanalyzing}
                      startContent={!isReanalyzing ? <RefreshCw size={14} /> : undefined}
                    >
                      วิเคราะห์ใหม่
                    </Button>
                  )}
                  {onDeleteTask && (
                    <Button size="sm" color="danger" variant="flat" onPress={() => setIsDeleteModalOpen(true)}>
                      <Trash2 size={14} /> ลบ
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">
                    ความคืบหน้าของงาน (อัปเดตจาก Checklist)
                  </span>
                  <span className="text-primary font-bold">
                    {task.progressPercent || 0}%
                  </span>
                </div>
                <Progress
                  value={task.progressPercent || 0}
                  color="primary"
                  size="md"
                  className="w-full"
                />
              </div>

              {/* ===== ASSIGNEES ===== */}
              {onAddAssignee && (
                <div className="space-y-2 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Users size={14} />
                      <span>ผู้รับผิดชอบ</span>
                    </div>
                    <Popover placement="bottom-end">
                      <PopoverTrigger>
                        <Button
                          size="sm"
                          variant="flat"
                          className="h-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs gap-1"
                        >
                          <UserPlus size={12} />
                          เพิ่ม
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="bg-zinc-900 border border-zinc-700 p-2 w-64 max-h-60 overflow-y-auto">
                        <div className="space-y-1">
                          <p className="text-xs text-zinc-400 font-medium px-2 pb-1">เลือกสมาชิก</p>
                          {(projectMembers || []).filter(
                            (m: any) => !(task.assignees || []).some((a: any) => a.id === m.id)
                          ).length === 0 ? (
                            <p className="text-xs text-zinc-500 text-center py-3">เพิ่มครบแล้ว</p>
                          ) : (
                            (projectMembers || []).filter(
                              (m: any) => !(task.assignees || []).some((a: any) => a.id === m.id)
                            ).map((m: any) => (
                              <button
                                key={m.id}
                                onClick={() => onAddAssignee(m.id)}
                                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-left"
                              >
                                <Avatar size="sm" name={m.displayName} className="w-6 h-6 text-[10px] shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs text-white truncate">{m.displayName}</p>
                                  {m.position?.positionName && (
                                    <p className="text-[10px] text-zinc-500 truncate">{m.position.positionName}</p>
                                  )}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  {(task.assignees || []).length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {task.assignees.map((u: any) => (
                        <div key={u.id} className="flex flex-col items-center gap-1 relative group">
                          <Avatar
                            size="sm"
                            name={u.displayName}
                            className="w-8 h-8 text-[11px]"
                          />
                          <span className="text-[10px] text-zinc-300 max-w-[56px] truncate text-center">
                            {u.displayName}
                          </span>
                          {onRemoveAssignee && (
                            <button
                              onClick={() => onRemoveAssignee(u.id)}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-danger-500 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                              title={`ลบ ${u.displayName}`}
                            >
                              <X size={8} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-600">ยังไม่มีผู้รับผิดชอบ</p>
                  )}
                </div>
              )}
            </div>

            {/* ===== TAB NAVIGATION ===== */}
            <div className="px-4 sm:px-6 pt-4">
              <div className="flex gap-2 flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.key
                        ? "bg-primary text-white shadow-md"
                        : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">
                      {tab.label.split("(")[0].trim()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ===== TAB CONTENT ===== */}
            <div className="p-4 sm:p-6">
              {activeTab === "submit_result" ? (
                <TaskV2SubmitResultTab
                  submitNote={task.submitNote || null}
                  submitImages={task.submitImages || null}
                />
              ) : activeTab === "actual_budget" ? (
                <TaskV2ActualBudgetTab
                  taskId={task.id}
                  organizationId={task.organizationId}
                />
              ) : !aiData ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                    <FileText size={20} className="text-zinc-500" />
                  </div>
                  <p className="text-zinc-400 text-sm font-medium">
                    ยังไม่มีข้อมูล AI สำหรับงานนี้
                  </p>
                  <p className="text-zinc-600 text-xs max-w-xs">
                    งานที่สร้างด้วยระบบ V2 จะมีข้อมูลประมาณการต้นทุน ความเสี่ยง
                    และ Checklist จาก AI อัตโนมัติ
                  </p>
                </div>
              ) : (
                <>
                  {activeTab === "card" && (
                    <TaskV2CardTab
                      aiData={aiData}
                      taskId={task.id}
                      currentBudget={Number(task.budget) || 0}
                      startActual={task.startActual || null}
                      finishActual={task.finishActual || null}
                      onBudgetChange={onBudgetChange}
                      aiRefDescription={aiRefDescription}
                      aiRefImages={aiRefImages}
                      onUpdateRef={onUpdateTaskInfo ? async (data) => {
                        await onUpdateTaskInfo(data);
                      } : undefined}
                      projectId={Number(projectInfo.id)}
                    />
                  )}
                  {activeTab === "prpo" && (
                    <TaskV2ProcurementTab
                      materials={aiData.materials}
                      taskId={task?.id}
                      onAddToProcurement={onAddToProcurement}
                    />
                  )}
                  {activeTab === "qcfield" && (
                    <TaskV2QCFieldTab
                      checklist={aiData.checklist}
                      taskName={task.taskName || ""}
                      onToggle={handleChecklistToggle}
                      onReorder={onReorderChecklist}
                      onEditSubtask={onEditSubtask}
                      startActual={task.startActual || null}
                      finishActual={task.finishActual || null}
                      taskId={task.id}
                      onStartTask={onStartTask}
                      onSubmitTask={onSubmitTask}
                    />
                  )}
                </>
              )}
            </div>
          </ModalBody>
        )}
      </ModalContent>

      <DeleteTaskModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        taskName={task?.taskName}
        isDeleting={isDeletingTask}
        onConfirm={handleConfirmDelete}
      />

      {/* ===== Re-analyze Preview Modal ===== */}
      <Modal
        isOpen={showReanalyzePreview}
        onOpenChange={(open) => {
          if (!open && !isSavingReanalyze) {
            setShowReanalyzePreview(false);
          }
        }}
        size="3xl"
        placement="center"
        scrollBehavior="inside"
        classNames={{
          base: "bg-[#0f1117] text-white rounded-2xl",
          closeButton: "text-zinc-400 hover:text-white",
          body: "p-0",
        }}
      >
        <ModalContent>
          {reanalyzePreview && (
            <>
              <ModalHeader className="flex items-center gap-2 border-b border-zinc-800 px-6 py-4">
                <Sparkles size={18} className="text-secondary" />
                <span className="font-bold">ผลวิเคราะห์ใหม่จาก AI</span>
              </ModalHeader>
              <ModalBody className="p-6 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
                {/* Cost */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <DollarSign size={16} />
                    <h4 className="font-bold text-sm">ประเมินงบประมาณ</h4>
                  </div>
                  <p className="text-2xl font-bold">
                    ฿ {reanalyzePreview.costEstimation.totalEstimate.toLocaleString("th-TH")}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs text-zinc-400">
                    <div>วัสดุ: ฿{reanalyzePreview.costEstimation.breakdown.materialCost.toLocaleString("th-TH")}</div>
                    <div>ค่าแรง: ฿{reanalyzePreview.costEstimation.breakdown.laborCost.toLocaleString("th-TH")}</div>
                    <div>เครื่องจักร: ฿{reanalyzePreview.costEstimation.breakdown.machineryCost.toLocaleString("th-TH")}</div>
                  </div>
                </div>
                {/* Duration */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-1">
                  <div className="flex items-center gap-2 text-primary">
                    <CalendarDays size={16} />
                    <h4 className="font-bold text-sm">ระยะเวลา</h4>
                  </div>
                  <p className="text-xl font-bold">{reanalyzePreview.durationEstimate.totalDays} วัน</p>
                  <p className="text-xs text-zinc-500">{reanalyzePreview.durationEstimate.assumptions}</p>
                </div>
                {/* Risks */}
                {reanalyzePreview.risks.length > 0 && (
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-warning">
                      <AlertTriangle size={16} />
                      <h4 className="font-bold text-sm">ความเสี่ยง ({reanalyzePreview.risks.length})</h4>
                    </div>
                    {reanalyzePreview.risks.map((r: any, i: number) => (
                      <div key={i} className="text-xs text-zinc-400 bg-zinc-800/50 rounded-lg p-2">
                        <span className="font-medium text-zinc-300">{r.name}</span>: {r.description}
                      </div>
                    ))}
                  </div>
                )}
                {/* Checklist */}
                {reanalyzePreview.checklist.length > 0 && (
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-sm text-zinc-300">Checklist ({reanalyzePreview.checklist.length} ขั้นตอน)</h4>
                    <div className="space-y-1">
                      {reanalyzePreview.checklist.map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                          <span className="text-zinc-600 font-mono w-5">{String(i + 1).padStart(2, "0")}</span>
                          <span>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Materials */}
                {reanalyzePreview.materials.length > 0 && (
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-sm text-zinc-300">วัสดุ ({reanalyzePreview.materials.length} รายการ)</h4>
                    <div className="space-y-1">
                      {reanalyzePreview.materials.map((m: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs text-zinc-400">
                          <span>{m.spec} ({m.quantity})</span>
                          <span className="font-medium">฿{m.totalPrice.toLocaleString("th-TH")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="border-t border-zinc-800 px-6 py-4 flex flex-col sm:flex-row gap-2">
                {/* <Button
                  variant="flat"
                  color="default"
                  onPress={() => setShowReanalyzePreview(false)}
                  isDisabled={isSavingReanalyze}
                  className="sm:flex-1"
                >
                  ยกเลิก
                </Button> */}
                <Button
                  variant="flat"
                  color="secondary"
                  onPress={handleReanalyze}
                  isDisabled={isSavingReanalyze}
                  startContent={<RefreshCw size={14} />}
                  className="sm:flex-1"
                >
                  วิเคราะห์ใหม่อีกครั้ง
                </Button>
                <Button
                  color="primary"
                  onPress={handleConfirmReanalyze}
                  isLoading={isSavingReanalyze}
                  startContent={!isSavingReanalyze ? <Check size={14} /> : undefined}
                  className="sm:flex-1 font-bold"
                >
                  บันทึกเพื่อแทนที่
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Modal>
  );
};

export default TaskV2DetailDialog;
