"use client";

import React, {
  useEffect,
  useTransition,
  useState,
} from "react";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  Textarea,
} from "@heroui/react";

import { HardHat } from "lucide-react";

import {
  createContractor,
  updateContractor,
} from "@/lib/actions/actionContractor";

import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  ContractorSchema,
  ContractorSchema_,
} from "@/lib/formValidationSchemas";

import { CreateContractorProps } from "@/lib/type";

export default function CreateContractor({
  isOpen,
  onOpenChange,
  editData
}: CreateContractorProps) {

  const router = useRouter();
  const isEditMode = !!editData;

  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContractorSchema>({
    resolver: zodResolver(ContractorSchema_),
    defaultValues: {
      contractorName: "",
      contractorPhone: "",
      contractorEmail: "",
      contractorAddress: "",
      contractorDesc: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && editData) {
        form.reset({
          contractorName: editData.contractorName ?? "",
          contractorPhone: editData.contractorPhone ?? "",
          contractorEmail: editData.contractorEmail ?? "",
          contractorAddress: editData.contractorAddress ?? "",
          contractorDesc: editData.contractorDesc ?? "",
        });
      } else {
        form.reset();
      }
    } else {
      form.reset();
    }
  }, [isOpen, editData]);

  const handleModalClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (data: ContractorSchema) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    startTransition(async () => {
      const res = isEditMode
        ? await updateContractor(editData.id, data)
        : await createContractor(data);
      if (res.success) {
        toast.success(
          isEditMode
            ? "แก้ไขผู้รับจ้างเรียบร้อย"
            : "เพิ่มผู้รับจ้างเรียบร้อย"
        );
        setIsSubmitting(false);
        router.refresh();
        handleModalClose();
      } else {
        toast.error(res.message || "บันทึกข้อมูลไม่สำเร็จ");
        setIsSubmitting(false);
      }
    });
  };

  const isBusy = isPending || isSubmitting;
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleModalClose();
        else onOpenChange(true);
      }}
      placement="center"
      backdrop="blur"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      classNames={{
        wrapper: "z-[9999]",
        base:
          "mx-4 w-full max-w-xl rounded-2xl bg-white dark:bg-[#18181b] shadow-2xl",
        header: "border-b border-default-100 p-6",
        body: "p-6 gap-6",
        footer: "border-t border-default-100 p-6",
      }}
    >

      <ModalContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col"
        >
          <ModalHeader className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-100">
              <HardHat className="text-orange-500" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEditMode
                  ? "แก้ไขผู้รับจ้าง"
                  : "เพิ่มผู้รับจ้าง"}
              </h2>

              <p className="text-default-400 text-xs">
                จัดการข้อมูลผู้รับจ้าง
              </p>
            </div>
          </ModalHeader>

          <ModalBody className="space-y-1">
            <Input
              isRequired
              label="ชื่อผู้รับจ้าง"
              placeholder="เช่น ทีมงาน ABC"
              labelPlacement="outside"
              variant="bordered"
              {...form.register("contractorName")}
              isInvalid={!!form.formState.errors.contractorName}
              errorMessage={
                form.formState.errors.contractorName?.message
              }
            />
            <Input
              label="เบอร์โทร"
              placeholder="เช่น 0812345678"
              labelPlacement="outside"
              variant="bordered"
              {...form.register("contractorPhone")}
            />
            <Input
              label="อีเมล"
              placeholder="example@email.com"
              labelPlacement="outside"
              variant="bordered"
              {...form.register("contractorEmail")}
            />
            <Input
              label="ที่อยู่"
              placeholder="ที่อยู่ผู้รับจ้าง"
              labelPlacement="outside"
              variant="bordered"
              {...form.register("contractorAddress")}
            />
            <Textarea
              label="รายละเอียดเพิ่มเติม"
              placeholder="รายละเอียดเกี่ยวกับผู้รับจ้าง"
              labelPlacement="outside"
              variant="bordered"
              minRows={3}
              {...form.register("contractorDesc")}
            />
          </ModalBody>

          <ModalFooter className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="light"
              color="danger"
              radius="full"
              onPress={handleModalClose}
              isDisabled={isBusy}
            >
              ยกเลิก
            </Button>

            <Button
              type="submit"
              radius="full"
              className="w-full sm:w-auto h-12 sm:h-10 font-medium bg-black text-white shadow-lg"
              isLoading={isBusy}
            >
              {isBusy
                ? "กำลังบันทึก..."
                : isEditMode
                  ? "บันทึกการแก้ไข"
                  : "เพิ่มผู้รับจ้าง"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}