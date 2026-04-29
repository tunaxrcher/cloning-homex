import { DeleteTaskModalProps } from "@/lib/type";
import { Modal, ModalContent, ModalBody, Button } from "@heroui/react";

const DeleteTaskModal = ({
  isOpen,
  onOpenChange,
  taskName,
  isDeleting,
  onConfirm,
}: DeleteTaskModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="sm"
      placement="center"
    >
      <ModalContent>
        {(onClose) => (
          <ModalBody className="py-6 text-center">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-danger-50 text-danger rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" x2="10" y1="11" y2="17" />
                  <line x1="14" x2="14" y1="11" y2="17" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold">ยืนยันการลบงาน</h3>
            <p className="text-sm text-default-500 mt-1">
              คุณแน่ใจหรือไม่ที่จะลบงาน <br />
              <span className="font-semibold text-foreground">
                "{taskName || "งานนี้"}"
              </span>{" "}
              ? <br />
              <span className="text-xs">การกระทำนี้ไม่สามารถย้อนกลับได้</span>
            </p>

            <div className="flex gap-3 justify-center mt-5">
              <Button
                variant="flat"
                onPress={onClose}
                isDisabled={isDeleting}
                className="px-6 font-medium"
              >
                ยกเลิก
              </Button>
              <Button
                color="danger"
                onPress={onConfirm}
                isLoading={isDeleting}
                className="px-6 font-medium"
              >
                ใช่, ลบงานเลย
              </Button>
            </div>
          </ModalBody>
        )}
      </ModalContent>
    </Modal>
  );
};

export default DeleteTaskModal;
