import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { AlertTriangle } from "lucide-react";

export default function DeletePointModal({
  isOpen,
  onOpenChange,
  pointToDelete,
  isDeleting,
  handleConfirmDeletePoint,
}: any) {
  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      backdrop="blur"
      classNames={{
        base: "bg-zinc-900 text-white border border-white/10",
        header: "border-b border-white/10",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex gap-2 items-center text-danger">
              <AlertTriangle size={20} />
              <span>ยืนยันการลบจุด 360°</span>
            </ModalHeader>
            <ModalBody className="py-6">
              <p>
                คุณแน่ใจหรือไม่ว่าต้องการลบจุด <strong>{pointToDelete?.title}</strong> ?
              </p>
              <div className="bg-danger/10 text-danger p-3 rounded-lg text-xs mt-2">
                <p>• รูปภาพ 360° จะถูกลบออกจากเซิร์ฟเวอร์ถาวร</p>
                <p>• ข้อมูลพิกัดบนแปลนนี้จะหายไปทันที</p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={isDeleting}>
                ยกเลิก
              </Button>
              <Button 
                color="danger" 
                onPress={handleConfirmDeletePoint} 
                isLoading={isDeleting}
                className="font-bold shadow-lg shadow-danger/30"
              >
                ลบทิ้งถาวร
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}