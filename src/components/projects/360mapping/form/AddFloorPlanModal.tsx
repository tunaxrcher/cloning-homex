"use client";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import { FileCheck, UploadCloud } from "lucide-react";

export default function AddFloorPlanModal({
  isOpen,
  onOpenChange,
  newFloorPlan,
  setNewFloorPlan,
  handleSaveFloorPlan,
  isSaving,
  floorPlanFile,
  setFloorPlanFile,
}: any) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(isOpenValue) => {
        if (!isOpenValue && !isSaving) {
          setNewFloorPlan({ name: "", imageUrl: "" });
          setFloorPlanFile(null);
        }
        onOpenChange(isOpenValue);
      }}
      backdrop="blur"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      hideCloseButton={isSaving}
    >
      <ModalContent className="bg-zinc-900 text-white">
        {(onClose) => (
          <>
            <ModalHeader>เพิ่มแปลนพื้นใหม่</ModalHeader>
            <ModalBody className="py-4 space-y-4">
              <Input
                label="ชื่อแปลน"
                placeholder="เช่น แปลนชั้น 1"
                variant="bordered"
                value={newFloorPlan.name}
                onValueChange={(v) =>
                  setNewFloorPlan({ ...newFloorPlan, name: v })
                }
                isDisabled={isSaving}
                classNames={{
                  inputWrapper: "border-zinc-700 hover:border-zinc-600",
                }}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 mb-2">
                  ไฟล์รูปภาพแปลนพื้น
                </label>

                <div className="relative group mt-2">
                  <label
                    htmlFor="file-upload"
                    className={`flex flex-col items-center justify-center w-full h-32 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
                      ${
                        floorPlanFile
                          ? "border-primary/50 bg-primary/5"
                          : "border-zinc-700 bg-zinc-800/50 hover:border-primary/50 hover:bg-zinc-800"
                      }
                      ${isSaving ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
                    `}
                  >
                    {floorPlanFile ? (
                      <div className="flex flex-col items-center space-y-2 text-primary">
                        <FileCheck
                          size={32}
                          className="animate-in zoom-in duration-300"
                        />
                        <span className="text-sm font-medium text-zinc-200 truncate max-w-[200px] sm:max-w-xs">
                          {floorPlanFile.name}
                        </span>
                        <span className="text-xs text-primary/80 bg-primary/10 px-2 py-1 rounded-md">
                          คลิกเพื่อเปลี่ยนไฟล์
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2 text-zinc-400 group-hover:text-primary transition-colors">
                        <UploadCloud size={32} />
                        <span className="text-sm font-medium text-zinc-300">
                          คลิกเพื่อเลือกไฟล์รูปภาพ
                        </span>
                        <span className="text-xs text-zinc-500">
                          รองรับเฉพาะไฟล์ .JPG, .JPEG
                        </span>
                      </div>
                    )}
                    <input
                      id="file-upload"
                      type="file"
                      accept=".jpg, .jpeg, image/jpeg"
                      className="hidden"
                      disabled={isSaving}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setFloorPlanFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                variant="light"
                onPress={onClose}
                isDisabled={isSaving}
              >
                ยกเลิก
              </Button>
              <Button
                color="primary"
                onPress={handleSaveFloorPlan}
                isDisabled={!newFloorPlan.name || !floorPlanFile || isSaving}
                isLoading={isSaving}
                className="font-bold shadow-lg"
              >
                อัปโหลดและบันทึก
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
