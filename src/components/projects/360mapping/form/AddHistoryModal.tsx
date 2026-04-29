"use client";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { UploadCloud, FileCheck, History } from "lucide-react";

export default function AddHistoryModal({
  isOpen,
  onOpenChange,
  pointToUpdateHistory,
  point360File,
  setPoint360File,
  isSaving,
  onSave,
}: any) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(isOpenValue) => {
        if (!isOpenValue && !isSaving) {
          setPoint360File(null);
        }
        onOpenChange(isOpenValue);
      }}
      backdrop="blur"
      // 🌟 ตั้งค่าป้องกันการเผลอปิด
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      hideCloseButton={isSaving}
    >
      <ModalContent className="bg-zinc-900 text-white">
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2 border-b border-white/10">
              <History size={18} className="text-primary" />
              <span>
                อัปโหลดรูปภาพใหม่ให้กับ: {pointToUpdateHistory?.title}
              </span>
            </ModalHeader>
            <ModalBody className="py-6">
              <p className="text-xs text-zinc-400 mb-4 italic">
                * รูปภาพนี้จะถูกบันทึกเป็นเวอร์ชันใหม่ของพิกัดนี้
                เพื่อใช้เปรียบเทียบตามช่วงเวลา
              </p>

              <div className="relative group">
                <label
                  htmlFor="history-upload"
                  className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all
                    ${
                      point360File
                        ? "border-primary bg-primary/5"
                        : "border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800"
                    }
                    ${isSaving ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
                  `}
                >
                  {point360File ? (
                    <div className="flex flex-col items-center text-primary">
                      <FileCheck
                        size={40}
                        className="animate-in zoom-in duration-300"
                      />
                      <span className="mt-2 text-xs truncate w-48 text-center">
                        {point360File.name}
                      </span>
                      <span className="text-xs text-primary/80 bg-primary/10 px-2 py-1 mt-1 rounded-md">
                        คลิกเพื่อเปลี่ยนไฟล์
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-zinc-500 group-hover:text-primary transition-colors">
                      <UploadCloud size={40} />
                      <span className="mt-2 text-sm font-medium text-zinc-300">
                        คลิกเพื่ออัปโหลดรูป 360 ใหม่
                      </span>
                      <span className="text-xs text-zinc-500">
                        รองรับเฉพาะไฟล์ .JPG, .JPEG
                      </span>
                    </div>
                  )}
                  <input
                    id="history-upload"
                    type="file"
                    accept=".jpg, .jpeg, image/jpeg"
                    className="hidden"
                    disabled={isSaving}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setPoint360File(e.target.files[0]);
                      }
                    }}
                  />
                </label>
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
                onPress={onSave}
                isLoading={isSaving}
                isDisabled={!point360File || isSaving}
                className="font-bold shadow-lg"
              >
                บันทึกเวอร์ชันใหม่
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
