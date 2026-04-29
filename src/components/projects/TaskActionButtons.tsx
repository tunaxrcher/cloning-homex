import { TaskActionButtonsProps } from "@/lib/type";
import { Button } from "@heroui/react";
const TaskActionButtons = ({
  isEditMode,
  setIsEditMode,
  isSaving,
  handleSaveTaskEdit,
  setIsDeleteModalOpen,
}: TaskActionButtonsProps) => {
  return (
    <>
      {/* 📌 เครื่องมือ (มุมขวาบน - Desktop) */}
      <div className="hidden md:flex absolute top-4 right-16 gap-2 z-10">
        {isEditMode ? (
          <>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              onPress={() => setIsEditMode(false)}
              isDisabled={isSaving}
            >
              ยกเลิก
            </Button>
            <Button
              size="sm"
              color="primary"
              onPress={handleSaveTaskEdit}
              isLoading={isSaving}
            >
              บันทึก
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="flat"
              onPress={() => setIsEditMode(true)}
            >
              ✏️ แก้ไข
            </Button>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              onPress={() => setIsDeleteModalOpen(true)}
            >
              🗑️ ลบ
            </Button>
          </>
        )}
      </div>

      {/* 📌 เครื่องมือ Mobile */}
      <div className="md:hidden flex justify-end gap-2 pt-2 px-4">
        {isEditMode ? (
          <>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              onPress={() => setIsEditMode(false)}
              isDisabled={isSaving}
            >
              ยกเลิก
            </Button>
            <Button
              size="sm"
              color="primary"
              onPress={handleSaveTaskEdit}
              isLoading={isSaving}
            >
              บันทึก
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="flat"
              onPress={() => setIsEditMode(true)}
            >
              ✏️ แก้ไข
            </Button>
            <Button
              size="sm"
              color="danger"
              variant="flat"
              onPress={() => setIsDeleteModalOpen(true)}
            >
              🗑️ ลบ
            </Button>
          </>
        )}
      </div>
    </>
  );
};

export default TaskActionButtons;
