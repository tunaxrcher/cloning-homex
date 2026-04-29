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

import { Building2 } from "lucide-react";

import {
  createSupplier,
  updateSupplier,
} from "@/lib/actions/actionSupplier";

import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  SupplierSchema,
  SupplierSchema_,
} from "@/lib/formValidationSchemas";

import { CreateSupplierProps } from "@/lib/type";

export default function CreateSupplier({
  isOpen,
  onOpenChange,
  editData
}: CreateSupplierProps) {

  const router = useRouter();
  const isEditMode = !!editData;

  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SupplierSchema>({
    resolver: zodResolver(SupplierSchema_),
    defaultValues: {
      supplierName: "",
      supplierPhone: "",
      supplierEmail: "",
      supplierAddress: "",
      supplierDesc: "",
    },
  });

  useEffect(() => {

    if (isOpen) {

      if (isEditMode && editData) {

        form.reset({
          supplierName: editData.supplierName ?? "",
          supplierPhone: editData.supplierPhone ?? "",
          supplierEmail: editData.supplierEmail ?? "",
          supplierAddress: editData.supplierAddress ?? "",
          supplierDesc: editData.supplierDesc ?? "",
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

  const onSubmit = (data: SupplierSchema) => {

    if (isSubmitting) return;

    setIsSubmitting(true);

    startTransition(async () => {

      const res = isEditMode
        ? await updateSupplier(editData.id, data)
        : await createSupplier(data);

      if (res.success) {

        toast.success(
          isEditMode
            ? "แก้ไขซัพพลายเออร์เรียบร้อย"
            : "เพิ่มซัพพลายเออร์เรียบร้อย"
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
              <Building2 className="text-orange-500" size={24} />
            </div>

            <div>

              <h2 className="text-lg font-bold">
                {isEditMode
                  ? "แก้ไขซัพพลายเออร์"
                  : "เพิ่มซัพพลายเออร์"}
              </h2>

              <p className="text-default-400 text-xs">
                จัดการข้อมูลซัพพลายเออร์
              </p>

            </div>

          </ModalHeader>

          <ModalBody className="space-y-1">

            <Input
              isRequired
              label="ชื่อซัพพลายเออร์"
              placeholder="เช่น บริษัท ABC ซัพพลาย จำกัด"
              labelPlacement="outside"
              variant="bordered"
              {...form.register("supplierName")}
              isInvalid={!!form.formState.errors.supplierName}
              errorMessage={
                form.formState.errors.supplierName?.message
              }
            />

            <Input
              label="เบอร์โทร"
              placeholder="เช่น 0812345678"
              labelPlacement="outside"
              variant="bordered"
              {...form.register("supplierPhone")}
              isInvalid={!!form.formState.errors.supplierPhone}
              errorMessage={
                form.formState.errors.supplierPhone?.message
              }
            />

            <Input
              label="อีเมล"
              placeholder="example@email.com"
              labelPlacement="outside"
              variant="bordered"
              {...form.register("supplierEmail")}
              isInvalid={!!form.formState.errors.supplierEmail}
              errorMessage={
                form.formState.errors.supplierEmail?.message
              }
            />

            <Input
              label="ที่อยู่"
              placeholder="ที่อยู่ซัพพลายเออร์"
              labelPlacement="outside"
              variant="bordered"
              {...form.register("supplierAddress")}
              isInvalid={!!form.formState.errors.supplierAddress}
              errorMessage={
                form.formState.errors.supplierAddress?.message
              }
            />

            <Textarea
              label="รายละเอียดเพิ่มเติม"
              placeholder="รายละเอียดเกี่ยวกับซัพพลายเออร์"
              labelPlacement="outside"
              variant="bordered"
              minRows={3}
              {...form.register("supplierDesc")}
              isInvalid={!!form.formState.errors.supplierDesc}
              errorMessage={
                form.formState.errors.supplierDesc?.message
              }
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
                  : "เพิ่มซัพพลายเออร์"}
            </Button>

          </ModalFooter>

        </form>

      </ModalContent>

    </Modal>
  );
}