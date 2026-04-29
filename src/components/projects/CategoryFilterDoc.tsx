"use client";

import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@heroui/react";
import { ListFilter, Check } from "lucide-react";
import { PROJECT_DOC_TYPES } from "@/lib/setting_data";
import { CategoryFilterDocProps } from "@/lib/type";

const CategoryFilterDoc = ({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterDocProps) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const categories = [
    "ทั้งหมด",
    ...PROJECT_DOC_TYPES.map((type) => type.textValue),
  ];

  return (
    <div className="w-full">
      <Button
        onPress={onOpen}
        variant="flat"
        color={selectedCategory !== "ทั้งหมด" ? "primary" : "default"}
        startContent={<ListFilter size={18} />}
        className="font-medium px-4"
        radius="full"
      >
        หมวดหมู่: {selectedCategory}
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        backdrop="blur"
        className="m-0 rounded-t-3xl sm:m-auto sm:rounded-2xl dark:bg-zinc-900" 
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 border-b border-default-100 text-lg">
                เลือกหมวดหมู่เอกสาร
              </ModalHeader>           
              <ModalBody className="p-0 max-h-[60vh] overflow-y-auto scrollbar-hide pb-8 pt-2">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    onClick={() => {
                      onSelectCategory(cat); 
                      onClose(); 
                    }}
                    className={`flex justify-between items-center w-full px-6 py-4 cursor-pointer hover:bg-default-100 active:bg-default-200 transition-colors ${
                      selectedCategory === cat
                        ? "text-primary font-bold bg-primary/5"
                        : "text-default-700 font-medium"
                    }`}
                  >
                    <span className="text-sm">{cat}</span>
                    {selectedCategory === cat && (
                      <Check size={20} className="text-primary" />
                    )}
                  </div>
                ))}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CategoryFilterDoc;