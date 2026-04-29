"use client";

import {
  Button,
  Input,
  Chip,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import {
  Search,
  X,
  Sparkles,
  Link2,
  CheckCircle2,
  ImageIcon,
  Calendar,
} from "lucide-react";

interface TaskItem {
  id: number;
  taskName: string | null;
  status: string;
  startPlanned: string | Date | null;
  coverImageUrl: string | null;
}

interface AiSuggestion {
  taskId: number;
  confidence: number;
  reason: string;
}

interface TaskLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  materialName: string;
  specification?: string | null;
  selectedTaskIds: Set<number>;
  onToggleTask: (taskId: number) => void;
  filteredTasks: TaskItem[];
  allTasks: TaskItem[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  aiSuggestions: AiSuggestion[];
  onAiSuggest: () => void;
  isAiSuggesting: boolean;
  onDismissSuggestion: (taskId: number) => void;
  onConfirm: () => void;
  isConfirming?: boolean;
  formatDate: (d: string | Date | null | undefined) => string | null;
}

const TaskLinkDialog = ({
  isOpen,
  onClose,
  materialName,
  specification,
  selectedTaskIds,
  onToggleTask,
  filteredTasks,
  allTasks,
  searchValue,
  onSearchChange,
  aiSuggestions,
  onAiSuggest,
  isAiSuggesting,
  onDismissSuggestion,
  onConfirm,
  isConfirming = false,
  formatDate,
}: TaskLinkDialogProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="3xl"
      scrollBehavior="inside"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
    >
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 pb-2">
              <div className="flex items-center gap-2">
                <Link2 size={18} />
                <span>เลือก Task ที่ต้องการผูก</span>
                <Chip size="sm" variant="flat" color="primary" className="ml-2">
                  เลือก {selectedTaskIds.size}
                </Chip>
              </div>
              {materialName && (
                <p className="text-xs text-default-400 font-normal">
                  {materialName}
                  {specification ? ` | ${specification}` : ""}
                </p>
              )}
            </ModalHeader>
            <ModalBody className="pt-0">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="ค้นหา Task..."
                  value={searchValue}
                  onValueChange={onSearchChange}
                  isClearable
                  size="sm"
                  startContent={<Search size={14} />}
                  className="flex-1"
                />
                <Tooltip content="AI แนะนำ Task ที่เกี่ยวข้อง">
                  <Button
                    size="sm"
                    variant="flat"
                    color="secondary"
                    startContent={<Sparkles size={14} />}
                    onPress={onAiSuggest}
                    isLoading={isAiSuggesting}
                  >
                    AI แนะนำ
                  </Button>
                </Tooltip>
              </div>

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="bg-secondary-50/50 dark:bg-secondary-900/10 rounded-xl p-3 space-y-2">
                  <p className="text-[10px] font-bold text-secondary-600 uppercase">
                    AI แนะนำ Task ที่เกี่ยวข้อง
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {aiSuggestions.map((s) => {
                      const task = allTasks.find((t) => t.id === s.taskId);
                      if (!task) return null;
                      return (
                        <div
                          key={s.taskId}
                          className="flex items-center justify-between bg-white dark:bg-zinc-800 rounded-lg p-2.5 border border-secondary-200 dark:border-secondary-800"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {task.taskName || `Task #${s.taskId}`}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Chip size="sm" variant="flat" color="secondary" className="text-[10px]">
                                {Math.round(s.confidence * 100)}%
                              </Chip>
                              <span className="text-[10px] text-default-400 truncate">
                                {s.reason}
                              </span>
                            </div>
                          </div>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={() => onDismissSuggestion(s.taskId)}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredTasks.length === 0 ? (
                <p className="text-xs text-default-400 text-center py-8">
                  {searchValue ? "ไม่พบ Task ที่ตรงกัน" : "ไม่มี Task"}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[360px] overflow-y-auto pr-1">
                  {filteredTasks.map((task) => {
                    const isSelected = selectedTaskIds.has(task.id);
                    return (
                      <div
                        key={task.id}
                        onClick={() => onToggleTask(task.id)}
                        className={`
                          relative cursor-pointer rounded-lg border-2 p-2.5 transition-all
                          hover:shadow-sm
                          ${isSelected
                            ? "border-primary bg-primary-50 dark:bg-primary-900/20 shadow-sm"
                            : "border-default-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-primary-300"
                          }
                        `}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 z-10">
                            <CheckCircle2 size={16} className="text-primary" />
                          </div>
                        )}
                        <div className="flex items-start gap-2 pr-5">
                          {task.coverImageUrl ? (
                            <img
                              src={task.coverImageUrl}
                              alt=""
                              className="w-10 h-10 rounded object-cover border border-default-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-default-100 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                              <ImageIcon size={14} className="text-default-300" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate leading-tight">
                              {task.taskName || `Task #${task.id}`}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Chip size="sm" variant="flat" className="text-[10px] h-4">
                                {task.status === "IN_PROGRESS" ? "กำลังทำ" : task.status === "COMPLETED" ? "เสร็จ" : "ยังไม่เริ่ม"}
                              </Chip>
                              {task.startPlanned && (
                                <span className="text-[10px] text-default-400 flex items-center gap-0.5">
                                  <Calendar size={10} />
                                  {formatDate(task.startPlanned)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ModalBody>
            <ModalFooter className="justify-center">
              {/* <Button variant="flat" onPress={onModalClose}>
                ยกเลิก
              </Button> */}
              <Button
                color="primary"
                startContent={<Link2 size={14} />}
                isLoading={isConfirming}
                onPress={async () => {
                  await onConfirm();
                  onModalClose();
                }}
              >
                ยืนยัน {selectedTaskIds.size > 0 ? `(${selectedTaskIds.size} Task)` : ""}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default TaskLinkDialog;
