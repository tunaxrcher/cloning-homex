import { SubtaskItemProps } from "@/lib/type";
import { Button, Checkbox, Input, Spinner, Textarea } from "@heroui/react";
import { Clock, Pencil, Trash2 } from "lucide-react";
import UploadSubtaskImage from "./forms/uploadSubtaskImage";
import { useState } from "react";

const SubtaskItem = ({
  subtask: s,
  updatingSubtaskId,
  editingSubtaskId,
  editingSubtaskData,
  isSavingSubtaskEdit,
  setEditingSubtaskData,
  startEditSubtask,
  setEditingSubtaskId,
  handleSaveSubtaskEdit,
  handleToggleSubtask,
  handleDeleteSubtask,
  canManage,
}: SubtaskItemProps) => {

  const [openUpload, setOpenUpload] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  return (
    <div className="border-b border-default-100 dark:border-zinc-800/50 pb-4 mb-3 last:border-0 last:mb-0">
      {editingSubtaskId === s.id ? (
        <div className="bg-default-50 dark:bg-zinc-800/50 p-4 rounded-xl space-y-4 animate-appearance-in border border-default-200 dark:border-zinc-700 shadow-sm">
          <div className="flex justify-between items-center">
            <p className="text-sm font-bold text-primary flex items-center gap-2">
              <Pencil size={16} /> แก้ไขรายการย่อย
            </p>
          </div>

          <Input
            size="sm"
            isRequired
            label="ชื่อรายการย่อย"
            labelPlacement="outside"
            placeholder="ระบุชื่องานย่อย..."
            variant="bordered"
            value={editingSubtaskData.detailName}
            onValueChange={(val) =>
              setEditingSubtaskData({ ...editingSubtaskData, detailName: val })
            }
          />

          <Textarea
            size="sm"
            label="รายละเอียดเพิ่มเติม"
            labelPlacement="outside"
            placeholder="ระบุรายละเอียด..."
            variant="bordered"
            minRows={2}
            value={editingSubtaskData.detailDesc}
            onValueChange={(val) =>
              setEditingSubtaskData({ ...editingSubtaskData, detailDesc: val })
            }
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input
              size="sm"
              type="date"
              label="วันที่เริ่ม"
              labelPlacement="outside"
              variant="bordered"
              value={editingSubtaskData.startPlanned}
              onValueChange={(val) =>
                setEditingSubtaskData({
                  ...editingSubtaskData,
                  startPlanned: val,
                })
              }
            />
            <Input
              size="sm"
              type="number"
              label="ระยะเวลา (วัน)"
              labelPlacement="outside"
              placeholder="เช่น 3"
              variant="bordered"
              min={1}
              value={editingSubtaskData.durationDays}
              onValueChange={(val) =>
                setEditingSubtaskData({
                  ...editingSubtaskData,
                  durationDays: val,
                })
              }
            />
            <Input
              size="sm"
              type="number"
              label="น้ำหนักงาน (%)"
              labelPlacement="outside"
              placeholder="เช่น 10"
              variant="bordered"
              min={0}
              max={100}
              value={editingSubtaskData.weightPercent}
              onValueChange={(val) =>
                setEditingSubtaskData({
                  ...editingSubtaskData,
                  weightPercent: val,
                })
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-default-200 dark:border-zinc-700 mt-2">
            <Button
              size="sm"
              variant="light"
              color="danger"
              onPress={() => setEditingSubtaskId(null)}
              isDisabled={isSavingSubtaskEdit}
            >
              ยกเลิก
            </Button>
            <Button
              size="sm"
              color="primary"
              className="font-medium px-6"
              onPress={handleSaveSubtaskEdit}
              isLoading={isSavingSubtaskEdit}
            >
              บันทึกการแก้ไข
            </Button>
          </div>
        </div>
      ) : (
        /* ---------------- โหมดปกติ (Display Mode) ---------------- */
        <div className="flex items-start justify-between w-full group transition-all duration-300 hover:bg-default-50 dark:hover:bg-zinc-800/40 p-3 rounded-xl -mx-3 px-3">
          <div className="flex items-start gap-3 w-full">
            {/* Checkbox / Spinner */}
            <div className="mt-0.5 shrink-0">
              {updatingSubtaskId === s.id ? (
                <Spinner size="sm" color="primary" className="w-5 h-5 ml-1" />
              ) : (
                <Checkbox
                  isSelected={!!s.status}
                  isDisabled={!canManage}
                  onValueChange={() => {
                    if (!canManage) return;
                    const wasDone = !!s.status;
                    if (wasDone) {
                      handleToggleSubtask(s.id, wasDone);
                      return;
                    }
                    setSelectedId(s.id);
                    setOpenUpload(true);
                  }}
                />
              )}
            </div>

            {/* ข้อมูลงานย่อย */}
            <div
              className="flex flex-col flex-1 pr-2 cursor-pointer"
              // onClick={() =>
              //   !updatingSubtaskId && handleToggleSubtask(s.id, !!s.status)
              // }
              onClick={() => {
                if (updatingSubtaskId || !canManage) return;
                const wasDone = !!s.status;
                if (wasDone) {
                  handleToggleSubtask(s.id, wasDone);
                  return;
                }
                setSelectedId(s.id);
                setOpenUpload(true);
              }}
            >
              <span
                className={`text-sm font-semibold ${!!s.status ? "line-through text-default-400" : "text-foreground"}`}
              >
                {s.detailName}
              </span>

              {s.detailDesc && (
                <span
                  className={`text-sm mt-1 leading-relaxed ${!!s.status ? "text-default-300" : "text-default-500"}`}
                >
                  {s.detailDesc}
                </span>
              )}

              <div className="flex flex-wrap gap-2 mt-3 text-[11px] font-medium text-default-500">
                {s.startPlanned && (
                  <span className="flex items-center gap-1.5 bg-default-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                    <Clock size={12} /> เริ่ม:{" "}
                    {new Date(s.startPlanned).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
                {s.durationDays && (
                  <span className="bg-default-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                    เวลา: {s.durationDays} วัน
                  </span>
                )}
                {s.weightPercent > 0 && (
                  <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md">
                    น้ำหนัก: {s.weightPercent}%
                  </span>
                )}
              </div>
            </div>
          </div>
          {canManage && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="text-default-400 hover:text-primary hover:bg-primary/10 transition-all"
                onPress={() => startEditSubtask(s)}
              >
                <Pencil size={16} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                className="text-default-400 hover:text-danger hover:bg-danger/10 transition-all"
                onPress={() => handleDeleteSubtask(s.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          )}
        </div>
      )}
      <UploadSubtaskImage
        isOpen={openUpload}
        onClose={() => setOpenUpload(false)}
        subtaskId={selectedId}
        onSuccess={(imageUrl) => {
          if (selectedId) {
            handleToggleSubtask(selectedId, false, imageUrl);
          }
        }}
      />
    </div>
  );
};

export default SubtaskItem;
