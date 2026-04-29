"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { Trash2, AlertTriangle } from "lucide-react";
import { ConfirmDeleteDocModal } from "@/lib/type";

const ConfirmDeleteModal = ({
  isOpen,
  onOpenChange,
  onConfirm,
  title = "ยืนยันการลบข้อมูล",
  description = "คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้",
  isLoading = false,
}: ConfirmDeleteDocModal) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      backdrop="blur"
      placement="center"
      className="dark text-foreground"
      size="sm"
    >
      <ModalContent className="mx-4">
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 pb-2">
              <div className="flex items-center gap-2 text-danger">
                <AlertTriangle size={20} />
                <h2 className="text-lg font-bold">{title}</h2>
              </div>
            </ModalHeader>

            <ModalBody className="py-2">
              <p className="text-sm text-default-500 leading-relaxed">
                {description}
              </p>
            </ModalBody>

            <ModalFooter className="pt-4 pb-6">
              <Button
                variant="light"
                onPress={onClose}
                isDisabled={isLoading}
                className="font-semibold text-default-500"
              >
                ยกเลิก
              </Button>
              <Button
                color="danger"
                variant="flat"
                onPress={onConfirm}
                isLoading={isLoading}
                className="font-bold px-6"
                startContent={!isLoading && <Trash2 size={18} />}
              >
                ยืนยันการลบ
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ConfirmDeleteModal;
