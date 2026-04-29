"use client";

import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { Trash2 } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  isLoading?: boolean;
}

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "ยืนยันการลบ",
  message,
  isLoading = false,
}: DeleteConfirmModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="sm"
    >
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="flex items-center gap-2 pb-2">
              <Trash2 size={18} className="text-danger" />
              <span>{title}</span>
            </ModalHeader>
            <ModalBody>
              <p className="text-sm text-default-600">{message}</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onModalClose} isDisabled={isLoading}>
                ยกเลิก
              </Button>
              <Button
                color="danger"
                startContent={<Trash2 size={14} />}
                isLoading={isLoading}
                onPress={async () => {
                  await onConfirm();
                  onModalClose();
                }}
              >
                ลบ
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default DeleteConfirmModal;
