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

import { Briefcase } from "lucide-react";

import {
  createPosition,
  updatePosition,
} from "@/lib/actions/actionPosition";

import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CreatePositionProps } from "@/lib/type";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PositionSchema,
  PositionSchema_,
} from "@/lib/formValidationSchemas";

export default function CreatePosition({
  isOpen,
  onOpenChange,
  editData,
}: CreatePositionProps) {

  const router = useRouter();
  const isEditMode = !!editData;

  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PositionSchema>({
    resolver: zodResolver(PositionSchema_),
    defaultValues: {
      positionName: "",
      positionDesc: "",
    },
  });

  /* ========================= */
  /* Reset & Edit Mode */
  /* ========================= */

  useEffect(() => {

    if (isOpen) {

      if (isEditMode && editData) {
        form.reset({
          positionName: editData.positionName ?? "",
          positionDesc: editData.positionDesc ?? "",
        });
      } else {
        form.reset();
      }

    } else {
      form.reset();
    }

  }, [isOpen, editData]);

  /* ========================= */
  /* Close */
  /* ========================= */

  const handleModalClose = () => {
    form.reset();
    onOpenChange(false);
  };

  /* ========================= */
  /* Submit */
  /* ========================= */

  const onSubmit = (data: PositionSchema) => {

    if (isSubmitting) return;

    setIsSubmitting(true);

    startTransition(async () => {

      const res = isEditMode
        ? await updatePosition(editData.id, data)
        : await createPosition(data);

      if (res.success) {

        toast.success(
          isEditMode
            ? "แก้ไขตำแหน่งเรียบร้อย"
            : "เพิ่มตำแหน่งเรียบร้อย"
        );

        setIsSubmitting(false); // ✅ เพิ่มบรรทัดนี้

        router.refresh();
        handleModalClose();

      } else {

        toast.error(res.message || "บันทึกไม่สำเร็จ");
        setIsSubmitting(false);

      }
    });
  };

  const isBusy = isPending || isSubmitting;

  /* ========================= */
  /* UI */
  /* ========================= */

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
      hideCloseButton={false}
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
          {/* HEADER */}
          <ModalHeader className="flex items-center gap-3">

            <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-100">
              <Briefcase className="text-orange-500" size={24} />
            </div>

            <div>
              <h2 className="text-lg font-bold">
                {isEditMode
                  ? "แก้ไขตำแหน่ง"
                  : "เพิ่มตำแหน่ง"}
              </h2>
              <p className="text-default-400 text-xs">
                {isEditMode
                  ? "แก้ไขข้อมูลตำแหน่งในองค์กร"
                  : "สร้างตำแหน่งใหม่ในองค์กร"}
              </p>
            </div>

          </ModalHeader>

          {/* BODY */}
          <ModalBody className="space-y-1">

            <Input
              isRequired
              label="ชื่อตำแหน่ง"
              placeholder="เช่น Manager, Admin"
              labelPlacement="outside"
              variant="bordered"
              {...form.register("positionName")}
              isInvalid={!!form.formState.errors.positionName}
              errorMessage={
                form.formState.errors.positionName?.message
              }
            />

            <Textarea
              label="รายละเอียด"
              placeholder="รายละเอียดเพิ่มเติมของตำแหน่ง"
              labelPlacement="outside"
              variant="bordered"
              minRows={3}
              {...form.register("positionDesc")}
              isInvalid={!!form.formState.errors.positionDesc}
              errorMessage={
                form.formState.errors.positionDesc?.message
              }
            />

          </ModalBody>

          {/* FOOTER */}
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
                  : "เพิ่มตำแหน่ง"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}