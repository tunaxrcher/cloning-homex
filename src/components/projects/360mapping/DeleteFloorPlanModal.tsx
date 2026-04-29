import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { AlertTriangle } from "lucide-react";

export default function DeleteFloorPlanModal({
  isOpen,
  onOpenChange,
  floorPlanToDelete,
  isDeleting,
  handleConfirmDelete,
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
              <span>ยืนยันการลบแปลนพื้น</span>
            </ModalHeader>
            <ModalBody className="py-6">
              <p>
                คุณแน่ใจหรือไม่ว่าต้องการลบ <strong>{floorPlanToDelete?.name}</strong> ?
              </p>
              <div className="bg-danger/10 text-danger p-3 rounded-lg text-xs mt-2 space-y-1">
                <p>• รูปภาพแปลนพื้นจะถูกลบออกจากเซิร์ฟเวอร์ถาวร</p>
                <p>
                  • <strong>
                    จุด 360 องศาทั้งหมดที่อยู่บนแปลนนี้ ({floorPlanToDelete?.points?.length || 0} จุด) จะถูกลบตามไปด้วย!
                  </strong>
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={isDeleting}>
                ยกเลิก
              </Button>
              <Button 
                color="danger" 
                onPress={handleConfirmDelete} 
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