"use client";

import { useState, useCallback } from "react";
import {
  Checkbox,
  Input,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import {
  GripVertical,
  Pencil,
  Check,
  X,
  Play,
  Send,
  Clock,
  CheckCircle2,
  ListChecks,
  Lock,
  CalendarDays,
  Timer,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import type { TaskV2ChecklistItem } from "@/lib/type";

interface TaskV2QCFieldTabProps {
  checklist: TaskV2ChecklistItem[];
  taskName: string;
  onToggle: (index: number) => void;
  onReorder: (reordered: TaskV2ChecklistItem[]) => void;
  onEditSubtask: (subtaskId: number, newName: string) => void;
  startActual: string | null;
  finishActual: string | null;
  onStartTask: (startDate: string) => Promise<void>;
  onSubmitTask: (finishDate: string) => Promise<void>;
}

function calcDaysBetween(start: string | Date, end: string | Date): number {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.abs(e.getTime() - s.getTime());
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* ─── Sortable Item ─── */
const SortableChecklistItem = ({
  item,
  index,
  onToggle,
  onStartEdit,
  editingId,
  editValue,
  setEditValue,
  onSaveEdit,
  onCancelEdit,
  isLocked,
  startActual,
}: {
  item: TaskV2ChecklistItem;
  index: number;
  onToggle: (i: number) => void;
  onStartEdit: (id: number, name: string) => void;
  editingId: number | null;
  editValue: string;
  setEditValue: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  isLocked: boolean;
  startActual: string | null;
}) => {
  const isEditing = editingId === item.id;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id ?? index });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : ("auto" as const),
  };

  const daysText =
    item.checked && item.finishActual && startActual
      ? `${calcDaysBetween(startActual, item.finishActual)} วัน`
      : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 rounded-xl border transition-all group ${item.checked
        ? "bg-success/5 border-success/30"
        : isLocked
          ? "bg-zinc-900/20 border-zinc-800/50 opacity-60"
          : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
        }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 shrink-0 touch-none"
        tabIndex={-1}
      >
        <GripVertical size={16} />
      </button>

      {/* Checkbox */}
      <Checkbox
        isSelected={item.checked}
        onValueChange={() => !isLocked && onToggle(index)}
        isDisabled={isLocked}
        size="sm"
        color="success"
        className="shrink-0"
      />

      {/* Content */}
      {isEditing ? (
        <div className="flex-1 flex items-center gap-1.5">
          <Input
            size="sm"
            variant="bordered"
            value={editValue}
            onValueChange={setEditValue}
            autoFocus
            classNames={{
              input: "text-sm text-white",
              inputWrapper: "bg-zinc-800 border-zinc-600 min-h-8 h-8",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit();
              if (e.key === "Escape") onCancelEdit();
            }}
          />
          <button
            onClick={onSaveEdit}
            className="p-1 rounded hover:bg-success/20 text-success shrink-0"
          >
            <Check size={14} />
          </button>
          <button
            onClick={onCancelEdit}
            className="p-1 rounded hover:bg-danger/20 text-danger shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="flex-1 min-w-0 space-y-0.5">
            <p
              className={`text-sm font-medium leading-tight ${isLocked ? "cursor-not-allowed" : "cursor-pointer"} ${item.checked
                ? "line-through text-zinc-500"
                : "text-zinc-200"
                }`}
              onClick={() => !isLocked && onToggle(index)}
            >
              {item.name}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-zinc-500">
                สัดส่วน: {item.progressPercent}%
              </p>
              {daysText && (
                <span className="text-[10px] text-success font-medium flex items-center gap-0.5">
                  <Clock size={10} />
                  {daysText}
                </span>
              )}
            </div>
          </div>
          {item.id && !isLocked && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit(item.id!, item.name);
              }}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-all shrink-0"
            >
              <Pencil size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─── */
const TaskV2QCFieldTab = ({
  checklist,
  taskName,
  onToggle,
  onReorder,
  onEditSubtask,
  startActual,
  finishActual,
  onStartTask,
  onSubmitTask,
}: TaskV2QCFieldTabProps) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [startDate, setStartDate] = useState(toLocalDateString(new Date()));
  const [submitDate, setSubmitDate] = useState(toLocalDateString(new Date()));
  const [isLoading, setIsLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const isStarted = !!startActual;
  const isFinished = !!finishActual;
  const isLocked = !isStarted;

  const totalItems = checklist.length;
  const checkedItems = checklist.filter((c) => c.checked).length;
  const progress =
    totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  const allDone = totalItems > 0 && checkedItems === totalItems;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = checklist.findIndex(
        (item) => (item.id ?? checklist.indexOf(item)) === active.id
      );
      const newIndex = checklist.findIndex(
        (item) => (item.id ?? checklist.indexOf(item)) === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(checklist, oldIndex, newIndex);
        onReorder(reordered);
      }
    },
    [checklist, onReorder]
  );

  const handleStartEdit = useCallback((id: number, name: string) => {
    setEditingId(id);
    setEditValue(name);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingId && editValue.trim()) {
      onEditSubtask(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue("");
  }, [editingId, editValue, onEditSubtask]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue("");
  }, []);

  const handleConfirmStart = useCallback(async () => {
    setIsLoading(true);
    try {
      await onStartTask(startDate);
      setShowStartDialog(false);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, onStartTask]);

  const handleConfirmSubmit = useCallback(async () => {
    setIsLoading(true);
    try {
      await onSubmitTask(submitDate);
      setShowSubmitDialog(false);
    } finally {
      setIsLoading(false);
    }
  }, [submitDate, onSubmitTask]);

  const sortableIds = checklist.map(
    (item, i) => item.id ?? i
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-sm">อัปเดตงานหน้าไซต์</h3>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              {!isStarted && (
                <Button
                  color="primary"
                  size="sm"
                  startContent={<Play size={14} />}
                  onPress={() => {
                    setStartDate(toLocalDateString(new Date()));
                    setShowStartDialog(true);
                  }}
                  className="font-bold"
                >
                  เริ่มงาน
                </Button>
              )}
              {isStarted && !isFinished && (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-success bg-success/10 border border-success/20 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 size={14} />
                    <span>เริ่มงานแล้ว: {new Date(startActual!).toLocaleDateString("th-TH")}</span>
                    <button
                      onClick={() => {
                        setStartDate(toLocalDateString(new Date(startActual!)));
                        setShowStartDialog(true);
                      }}
                      className="ml-1 p-0.5 rounded hover:bg-success/20 text-success/70 hover:text-success transition-colors"
                      title="แก้ไขวันที่เริ่มงาน"
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                  <Button
                    color="success"
                    size="sm"
                    startContent={<Send size={14} />}
                    onPress={() => {
                      setSubmitDate(toLocalDateString(new Date()));
                      setShowSubmitDialog(true);
                    }}
                    className="font-bold"
                    isDisabled={!allDone}
                  >
                    ส่งงาน
                  </Button>
                </>
              )}
              {isFinished && (
                <div className="flex items-center gap-1.5 text-xs text-success bg-success/10 border border-success/20 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 size={14} />
                  <span>ส่งงานแล้ว: {new Date(finishActual!).toLocaleDateString("th-TH")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Lock notice */}
          {isLocked && (
            <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 border border-warning/20 px-3 py-2 rounded-lg">
              <Lock size={14} />
              <span>กรุณากด &quot;เริ่มงาน&quot; ก่อน จึงจะสามารถติ๊ก Checklist ได้</span>
            </div>
          )}
          {isStarted && !isFinished && !allDone && (
            <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-800/50 border border-zinc-700/50 px-3 py-2 rounded-lg">
              <AlertCircle size={14} />
              <span>ต้องทำ Subtask ให้ครบทุกรายการก่อนจึงจะส่งงานได้ ({checkedItems}/{totalItems})</span>
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortableIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide pr-1">
                {checklist.map((item, i) => (
                  <SortableChecklistItem
                    key={item.id ?? i}
                    item={item}
                    index={i}
                    onToggle={onToggle}
                    onStartEdit={handleStartEdit}
                    editingId={editingId}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    isLocked={isLocked}
                    startActual={startActual}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

        </div>

        {/* Right: Dashboard Summary */}
        <div className="space-y-4">
          {/* Status cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-500">
                <CalendarDays size={13} />
                <span className="text-[10px] uppercase tracking-wider">เริ่มงาน</span>
              </div>
              <p className="text-sm font-bold text-zinc-200">
                {startActual ? new Date(startActual).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-500">
                <CheckCircle2 size={13} />
                <span className="text-[10px] uppercase tracking-wider">ส่งงาน</span>
              </div>
              <p className="text-sm font-bold text-zinc-200">
                {finishActual ? new Date(finishActual).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-500">
                <Timer size={13} />
                <span className="text-[10px] uppercase tracking-wider">ระยะเวลารวม</span>
              </div>
              <p className="text-sm font-bold text-zinc-200">
                {startActual && finishActual
                  ? `${calcDaysBetween(startActual, finishActual)} วัน`
                  : startActual
                    ? `${calcDaysBetween(startActual, new Date())} วัน (กำลังดำเนินการ)`
                    : "—"}
              </p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-500">
                <ListChecks size={13} />
                <span className="text-[10px] uppercase tracking-wider">ขั้นตอน</span>
              </div>
              <p className="text-sm font-bold">
                <span className="text-success">{checkedItems}</span>
                <span className="text-zinc-500">/{totalItems}</span>
              </p>
            </div>
          </div>

          {/* Subtask breakdown table (collapsible) */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowBreakdown((v) => !v)}
              className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-zinc-800/40 transition-colors"
            >
              <ListChecks size={14} className="text-primary" />
              <h3 className="font-bold text-xs text-zinc-300">สรุปขั้นตอนงาน</h3>
              <span className="text-[10px] text-zinc-500 ml-auto mr-1">{checkedItems}/{totalItems}</span>
              <ChevronDown
                size={14}
                className={`text-zinc-500 transition-transform duration-200 ${showBreakdown ? "rotate-180" : ""}`}
              />
            </button>
            {showBreakdown && (
              <div className="divide-y divide-zinc-800/70 border-t border-zinc-800">
                {checklist.map((item, i) => {
                  const days =
                    item.checked && item.finishActual && startActual
                      ? calcDaysBetween(startActual, item.finishActual)
                      : null;

                  return (
                    <div
                      key={item.id ?? i}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <span className="text-[10px] text-zinc-600 font-mono w-5 shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p
                        className={`flex-1 text-xs leading-tight truncate ${
                          item.checked ? "text-zinc-500" : "text-zinc-300"
                        }`}
                      >
                        {item.name}
                      </p>
                      {item.checked ? (
                        <span className="text-[11px] text-success font-medium flex items-center gap-1 shrink-0">
                          <Clock size={11} />
                          {days !== null ? `${days} วัน` : "เสร็จ"}
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-600 shrink-0">รอดำเนินการ</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Start Task Dialog ─── */}
      <Modal
        isOpen={showStartDialog}
        onOpenChange={(open) => !isLoading && setShowStartDialog(open)}
        size="sm"
        placement="center"
        classNames={{
          base: "bg-[#1a1b23] text-white",
          closeButton: "text-zinc-400 hover:text-white",
        }}
      >
        <ModalContent>
          <ModalHeader className="text-base font-bold">เลือกวันที่เริ่มงาน</ModalHeader>
          <ModalBody>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-primary"
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              size="sm"
              onPress={handleConfirmStart}
              isLoading={isLoading}
              className="font-bold w-100"
            >
              ยืนยัน
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ─── Submit Task Dialog ─── */}
      <Modal
        isOpen={showSubmitDialog}
        onOpenChange={(open) => !isLoading && setShowSubmitDialog(open)}
        size="sm"
        placement="center"
        classNames={{
          base: "bg-[#1a1b23] text-white",
          closeButton: "text-zinc-400 hover:text-white",
        }}
      >
        <ModalContent>
          <ModalHeader className="text-base font-bold">ส่งงาน</ModalHeader>
          <ModalBody>
            <p className="text-sm text-zinc-400 mb-2">
              เลือกวันที่ส่งงาน
            </p>
            <input
              type="date"
              value={submitDate}
              onChange={(e) => setSubmitDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-primary"
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              size="sm"
              onPress={() => setShowSubmitDialog(false)}
              isDisabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button
              color="success"
              size="sm"
              onPress={handleConfirmSubmit}
              isLoading={isLoading}
              className="font-bold"
            >
              ยืนยันส่งงาน
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default TaskV2QCFieldTab;
