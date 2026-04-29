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
import { UploadCloud, FileCheck, MapPin } from "lucide-react";

export default function AddPointModal({
  isOpen,
  onOpenChange,
  setTempPoint,
  newPointData,
  setNewPointData,
  handleSavePoint,
  point360File,
  setPoint360File,
  isSavingPoint,
}: any) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(isOpenValue) => {
        if (!isOpenValue && !isSavingPoint) {
          setTempPoint(null);
          setPoint360File(null);
          setNewPointData({ title: "", location: "", thumbnail: "" });
        }
        onOpenChange(isOpenValue);
      }}
      backdrop="opaque"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      hideCloseButton={isSavingPoint}
    >
      <ModalContent className="bg-zinc-900 text-white border border-white/10 shadow-2xl">
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2 border-b border-white/10 pb-4">
              <MapPin className="text-primary" size={20} />
              <span>ระบุข้อมูลจุด 360°</span>
            </ModalHeader>
            <ModalBody className="py-6 space-y-6">
              <Input
                label="ชื่อจุด (Title)"
                placeholder="เช่น ทางเดินกลาง, โถงรับแขก"
                variant="bordered"
                value={newPointData.title}
                onValueChange={(v) =>
                  setNewPointData({ ...newPointData, title: v })
                }
                isDisabled={isSavingPoint}
                classNames={{
                  inputWrapper: "border-zinc-700 hover:border-zinc-600",
                }}
              />
              <Input
                label="รายละเอียด/ตำแหน่ง"
                placeholder="เช่น ชั้น 1 โซน A (ไม่บังคับ)"
                variant="bordered"
                value={newPointData.location}
                onValueChange={(v) =>
                  setNewPointData({ ...newPointData, location: v })
                }
                isDisabled={isSavingPoint}
                classNames={{
                  inputWrapper: "border-zinc-700 hover:border-zinc-600",
                }}
              />

              {/* กล่องอัปโหลดรูป 360 สวยๆ */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <label className="text-sm font-medium text-zinc-300">
                  ภาพ 360 องศา (Equirectangular)
                </label>

                <div className="relative group mt-2">
                  <label
                    htmlFor="point-file-upload"
                    className={`flex flex-col items-center justify-center w-full h-36 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
                      ${
                        point360File
                          ? "border-primary/50 bg-primary/5"
                          : "border-zinc-700 bg-zinc-800/50 hover:border-primary/50 hover:bg-zinc-800"
                      }
                      ${isSavingPoint ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
                    `}
                  >
                    {point360File ? (
                      <div className="flex flex-col items-center space-y-2 text-primary">
                        <FileCheck
                          size={36}
                          className="animate-in zoom-in duration-300"
                        />
                        <span className="text-sm font-medium text-zinc-200 truncate max-w-[200px] sm:max-w-xs text-center">
                          {point360File.name}
                        </span>
                        <span className="text-xs text-primary/80 bg-primary/10 px-3 py-1 rounded-full">
                          คลิกเพื่อเปลี่ยนไฟล์
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2 text-zinc-400 group-hover:text-primary transition-colors">
                        <UploadCloud size={36} />
                        <span className="text-sm font-medium text-zinc-300">
                          คลิกเพื่ออัปโหลดภาพ 360°
                        </span>
                        <span className="text-xs text-zinc-500 text-center">
                          รองรับไฟล์ .JPG, .JPEG <br />
                          (สัดส่วนภาพแบบพาโนรามา 2:1)
                        </span>
                      </div>
                    )}

                    <input
                      id="point-file-upload"
                      type="file"
                      accept=".jpg, .jpeg, image/jpeg"
                      className="hidden"
                      disabled={isSavingPoint}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setPoint360File(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-white/10 pt-4">
              <Button
                color="danger"
                variant="light"
                onPress={onClose}
                isDisabled={isSavingPoint}
              >
                ยกเลิก
              </Button>
              <Button
                color="primary"
                onPress={handleSavePoint}
                isDisabled={
                  !newPointData.title || !point360File || isSavingPoint
                }
                isLoading={isSavingPoint}
                className="font-bold shadow-lg"
              >
                บันทึกพิกัดและรูปภาพ
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
