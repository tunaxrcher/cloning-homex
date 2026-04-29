import React from "react";
import { Card, CardBody, Button } from "@heroui/react";
import { ClipboardList } from "lucide-react";

interface EmptyStateCardProps {
  onOpen: () => void;
}

export const EmptyStateCard = React.memo(({ onOpen }: EmptyStateCardProps) => (
  <div className="flex justify-center w-full py-10">
    <Card className="w-full max-w-md bg-transparent border-dashed border-2 border-default-300 shadow-none">
      <CardBody className="flex flex-col items-center justify-center gap-4 py-8">
        <div className="p-4 rounded-full bg-default-100 text-default-500">
          <ClipboardList size={48} strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-lg font-semibold text-default-700 dark:text-default-300">
            ไม่พบข้อมูลงาน
          </p>
          <p className="text-sm text-default-400">
            ไม่มีงานที่ตรงกับเงื่อนไข หรือยังไม่ได้สร้างงาน
          </p>
        </div>
        <Button onPress={onOpen} color="primary" variant="flat" radius="full" className="mt-2">
          สร้างงานใหม่
        </Button>
      </CardBody>
    </Card>
  </div>
));

EmptyStateCard.displayName = "EmptyStateCard";