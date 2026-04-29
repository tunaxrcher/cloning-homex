"use client";

import { DeleteCameraModalProps } from "@/lib/type";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { AlertTriangle } from "lucide-react";



export default function DeleteCameraModal({
  camera,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteCameraModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isDeleting) onClose();
      }}
      backdrop="blur"
      classNames={{
        base: "bg-zinc-900 text-white",
        header: "border-b border-white/10",
        footer: "border-t border-white/10",
        closeButton: "hover:bg-white/10",
      }}
    >
      <ModalContent>
        {(onCloseModal) => (
          <>
            <ModalHeader className="flex gap-2 items-center text-danger">
              <AlertTriangle size={20} />
              <span>ยืนยันการลบกล้อง</span>
            </ModalHeader>
            <ModalBody className="py-6">
              <p>
                คุณแน่ใจหรือไม่ว่าต้องการลบกล้อง{" "}
                <strong className="text-primary">{camera?.name}</strong> (SN:{" "}
                {camera?.id}) ออกจากระบบ?
              </p>
              <p className="text-xs text-zinc-400 mt-2">
                การกระทำนี้ไม่สามารถกู้คืนได้
              </p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={onCloseModal} 
                isDisabled={isDeleting}
              >
                ยกเลิก
              </Button>
              <Button
                color="danger"
                onPress={onConfirm}
                isLoading={isDeleting}
                className="font-bold"
              >
                ลบข้อมูลทันที
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}