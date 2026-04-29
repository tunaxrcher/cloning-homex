"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useTransition,
  useActionState,
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
  Spinner,
} from "@heroui/react";

import {
  UserPlus,
  UploadCloud,
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

import { createCustomer, updateCustomer } from "@/lib/actions/actionUser";
import { deleteFileS3, handleImageUpload } from "@/lib/actions/actionIndex";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CreateCustomerProps } from "@/lib/type";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CustomerSchema,
  CustomerSchema_,
} from "@/lib/formValidationSchemas";

export default function CreateCustomer({
  isOpen,
  onOpenChange,
  editData
}: CreateCustomerProps) {

  const router = useRouter();
  const isEditMode = !!editData;

  const [isPending, startTransition] = useTransition();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSuccessRef = useRef(false);

  // const handledRef = useRef(false);
  // const isSuccessRef = useRef(false);
  const submittingRef = useRef(false);

  useEffect(() => {

    if (isOpen) {

      if (isEditMode && editData) {

        formCustomer.reset({
          username: editData.username ?? "",
          displayName: editData.displayName ?? "",
          phone: editData.phone ?? "",
          email: editData.email ?? "",
          address: editData.address ?? "",
          note: editData.note ?? "",
          password: ""
        });

        setImagePreview(editData.avatarUrl ?? null);
        setImageUrl(editData.avatarUrl ?? undefined);

      } else {
        resetFormState();
      }

    } else {

      // 🔥 reset ตอน modal ปิด
      resetFormState();

    }

  }, [isOpen, editData]);

  useEffect(() => {
    if (isOpen) {
      submittingRef.current = false;
    }
  }, [isOpen]);

  const formCustomer = useForm<CustomerSchema>({
    resolver: zodResolver(CustomerSchema_),
    defaultValues: {
      username: "",
      password: "",
      displayName: "",
      phone: "",
      email: "",
      address: "",
      note: "",
      imageUrl: "",
    },
  });

  const resetFormState = () => {
    formCustomer.reset();
    setImagePreview(null);
    setImageUrl(undefined);
    setIsUploading(false);
    setIsDeleting(false);
  };

const handleModalClose = async (isSuccess = false) => {

  const originalImage = editData?.avatarUrl;

  // ลบเฉพาะ cancel
  if (!isSuccess && imageUrl && imageUrl !== originalImage) {

    setIsDeleting(true);

    try {
      const urlObj = new URL(imageUrl);
      let fileKey = urlObj.pathname.substring(1);

      if (fileKey.startsWith("homex/")) {
        fileKey = fileKey.replace("homex/", "");
      }

      await deleteFileS3(fileKey);

    } finally {
      setIsDeleting(false);
    }
  }

  resetFormState();
  onOpenChange(false);
};

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {

    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setImagePreview(URL.createObjectURL(file));

    try {
      const uploaded = await handleImageUpload(file, "img_customer");
      setImageUrl(uploaded);
    } catch {
      toast.error("อัปโหลดรูปไม่สำเร็จ");
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const [state, formAction] = useActionState(createCustomer, {
    success: false,
    error: false,
    message: "",
  });

  const onSubmit = (data: CustomerSchema) => {

    if (isUploading) {
      toast.warning("กรุณารออัปโหลดรูปภาพ...");
      return;
    }

    if (submittingRef.current) return;

    submittingRef.current = true;

    startTransition(async () => {

      if (isEditMode) {

        const res = await updateCustomer(
          editData.id,
          {
            ...data,
            avatarUrl: imageUrl
          }
        );

        if (res.success) {
          toast.success("แก้ไขลูกค้าเรียบร้อย!");
          router.refresh();
          handleModalClose(true);
        }

      } else {

        formAction({
          ...data,
          avatarUrl: imageUrl
        });

      }

    });
  };

  useEffect(() => {
    if (!state) return;

    if (state.success) {
      isSuccessRef.current = true;

      toast.success("สร้างลูกค้าเรียบร้อย!");
      router.refresh();
      submittingRef.current = false;

      handleModalClose(true);
    }

    if (state.error) {
      submittingRef.current = false;
      toast.error(state.message || "บันทึกไม่สำเร็จ");
    }

  }, [state]); // 🔥 ฟังทั้ง object

  const isBusy = isPending || isUploading || isDeleting;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleModalClose(false);
        else onOpenChange(true);
      }}
      scrollBehavior="inside"
      placement="center"
      backdrop="blur"
      isDismissable={false}
      isKeyboardDismissDisabled
      hideCloseButton={isBusy}
      classNames={{
        wrapper: "z-[9999]",
        base:
          "mx-4 w-full max-w-3xl max-h-[90dvh] rounded-2xl bg-white dark:bg-[#18181b] shadow-2xl",
        header: "border-b border-default-100 p-4 sm:p-6",
        body: "p-4 sm:p-6 gap-6",
        footer: "border-t border-default-100 p-4 sm:p-6",
      }}
    >
      <ModalContent>
        <form
          onSubmit={formCustomer.handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <ModalHeader className="flex flex-row items-center gap-3">
            <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-100">
              <UserPlus className="text-orange-500" size={24} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">
                {isEditMode ? "แก้ไขลูกค้า" : "เพิ่มลูกค้า"}
              </h2>
              <p className="text-default-400 text-xs">
                {isEditMode ? "แก้ไขข้อมูลลูกค้า" : "สร้างบัญชีลูกค้าใหม่"}
              </p>
            </div>
          </ModalHeader>

          <ModalBody>

            {/* Upload (เหมือน employee ทุกอย่าง) */}
            <div className="relative group w-full h-48 sm:h-56 rounded-2xl border-2 border-dashed border-default-200 hover:border-primary transition-all bg-default-50/50 dark:bg-default-100/10 overflow-hidden cursor-pointer shrink-0">
              <input
                type="file"
                accept="image/*"
                disabled={isBusy}
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 z-20 cursor-pointer disabled:cursor-not-allowed"
              />

              {(isUploading || isDeleting) && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                  <Spinner color="warning" />
                  <span className="text-white text-xs mt-2">
                    {isDeleting ? "กำลังลบรูป..." : "กำลังอัปโหลดรูป..."}
                  </span>
                </div>
              )}

              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {!isBusy && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-medium flex gap-2">
                        <ImageIcon /> เปลี่ยนรูปภาพ
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="p-4 bg-white rounded-full shadow-sm">
                    <UploadCloud size={32} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      อัปโหลดรูปโปรไฟล์{" "}
                    </p>
                    <p className="text-xs text-default-400">
                      JPG, PNG ไม่เกิน 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

              <Input
                isRequired
                label="Username"
                placeholder="ระบุ Username"
                labelPlacement="outside"
                variant="bordered"
                startContent={<User size={18} />}
                {...formCustomer.register("username")}
              />

              <Input
                isRequired={!isEditMode}   // 🔥 create = required, edit = optional
                type="password"
                label={
                  isEditMode
                    ? "เปลี่ยนรหัสผ่าน (เว้นว่างถ้าไม่ต้องการเปลี่ยน)"
                    : "Password"
                }
                placeholder={
                  isEditMode
                    ? "กรอกเฉพาะกรณีต้องการเปลี่ยน"
                    : "ระบุ Password"
                }
                labelPlacement="outside"
                variant="bordered"
                startContent={<Lock size={18} />}
                {...formCustomer.register("password")}
              />

              <Input
                isRequired
                label="ชื่อที่แสดง"
                placeholder="ระบุชื่อที่แสดง"
                labelPlacement="outside"
                variant="bordered"
                startContent={<User size={18} />}
                {...formCustomer.register("displayName")}
              />

              <Input
                label="เบอร์โทร"
                placeholder="ระบุเบอร์โทร"
                labelPlacement="outside"
                variant="bordered"
                startContent={<Phone size={18} />}
                {...formCustomer.register("phone")}
              />

              <Input
                label="Email"
                placeholder="example@email.com"
                labelPlacement="outside"
                variant="bordered"
                startContent={<Mail size={18} />}
                {...formCustomer.register("email")}
              />

              <Input
                label="Address"
                placeholder="ระบุที่อยู่"
                labelPlacement="outside"
                variant="bordered"
                startContent={<MapPin size={18} />}
                {...formCustomer.register("address")}
              />

            </div>

            <Textarea
              label="รายละเอียด"
              placeholder="ระบุรายละเอียด..."
              labelPlacement="outside"
              variant="bordered"
              minRows={3}
              startContent={<FileText size={18} />}
              {...formCustomer.register("note")}
            />
          </ModalBody>

          <ModalFooter className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="light"
              color="danger"
              radius="full"
              onPress={() => handleModalClose(false)}
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
              {isUploading
                ? "กำลังอัปโหลด..."
                : isDeleting
                  ? "กำลังลบ..."
                  : isPending
                    ? "กำลังบันทึก..."
                    : isEditMode
                      ? "บันทึกการแก้ไข"
                      : "เพิ่มลูกค้า"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}