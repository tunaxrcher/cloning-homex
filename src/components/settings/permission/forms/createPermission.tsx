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

import { Shield } from "lucide-react";

import {
  createPermission,
  updatePermission,
} from "@/lib/actions/actionPermission";

import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CreatePermissionProps } from "@/lib/type";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PermissionSchema,
  PermissionSchema_,
} from "@/lib/formValidationSchemas";

export default function CreatePermission({
  isOpen,
  onOpenChange,
  editData,
}: CreatePermissionProps) {

  const router = useRouter();
  const isEditMode = !!editData;

  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PermissionSchema>({
    resolver: zodResolver(PermissionSchema_),
    defaultValues: {
      permissionKey: "",
      permissionName: "",
      permissionDesc: "",
    },
  });

  useEffect(() => {

    if (isOpen) {
      if (isEditMode && editData) {
        form.reset({
          permissionKey: editData.permissionKey ?? "",
          permissionName: editData.permissionName ?? "",
          permissionDesc: editData.permissionDesc ?? "",
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

  const onSubmit = (data: PermissionSchema) => {

    if (isSubmitting) return;
    setIsSubmitting(true);
    startTransition(async () => {
      const res = isEditMode
        ? await updatePermission(editData.id, data)
        : await createPermission(data);

      if (res.success) {
        toast.success(
          isEditMode
            ? "แก้ไข Permission เรียบร้อย"
            : "เพิ่ม Permission เรียบร้อย"
        );
        setIsSubmitting(false);   // ✅ เพิ่มบรรทัดนี้
        router.refresh();
        handleModalClose();

      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
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
              <Shield className="text-orange-500" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEditMode
                  ? "แก้ไขสิทธิ์"
                  : "เพิ่มสิทธิ์"}
              </h2>
              <p className="text-default-400 text-xs">
                จัดการสิทธิ์การใช้งานระบบ
              </p>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-1">
            <Input
              isRequired
              label="Permission Key"
              placeholder="เช่น Page_Setting"
              labelPlacement="outside"
              variant="bordered"
              {...form.register("permissionKey")}
              isInvalid={!!form.formState.errors.permissionKey}
              errorMessage={
                form.formState.errors.permissionKey?.message
              }
            />
            <Input
              isRequired
              label="Permission Name"
              placeholder="เช่น หน้าตั้งค่า"
              labelPlacement="outside"
              variant="bordered"
              {...form.register("permissionName")}
              isInvalid={!!form.formState.errors.permissionName}
              errorMessage={
                form.formState.errors.permissionName?.message
              }
            />

            <Textarea
              label="รายละเอียด"
              placeholder="รายละเอียดสิทธิ์"
              labelPlacement="outside"
              variant="bordered"
              minRows={3}
              {...form.register("permissionDesc")}
              isInvalid={!!form.formState.errors.permissionDesc}
              errorMessage={
                form.formState.errors.permissionDesc?.message
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
                  : "เพิ่มสิทธิ์"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}