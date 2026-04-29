"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Spinner,
} from "@heroui/react";
import {
  Building2,
  MapPin,
  Wallet,
  UploadCloud,
  User,
  Image as ImageIcon,
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectSchema, ProjectSchema_ } from "@/lib/formValidationSchemas";
import { createProject, updateProject } from "@/lib/actions/actionProject";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CreateProjectProps } from "@/lib/type";
import { deleteFileS3, handleImageUpload } from "@/lib/actions/actionIndex";

export const CreateProject = ({
  isOpen,
  onOpenChange,
  organizationId,
  currentUserId,
  editData,
}: CreateProjectProps & { editData?: any }) => {
  const router = useRouter();
  const isEditMode = !!editData;

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(
    undefined,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSuccessRef = useRef(false);
  // ❌ ลบ handledRef ออกไปเลย ไม่ต้องใช้แล้ว

  const defaultFormValues = {
    projectName: "",
    customerName: "",
    address: "",
    mapUrl: "",
    budget: "" as unknown as number,
    startPlanned: "",
    finishPlanned: "",
    projectDesc: "",
    coverImageUrl: "",
    createdById: currentUserId,
    organizationId: organizationId,
  };

  const formAddProject = useForm<ProjectSchema>({
    resolver: zodResolver(ProjectSchema_),
    defaultValues: defaultFormValues,
  });

  const [isPending, startTransition] = useTransition();

  // 📌 1. โหลดข้อมูลเมื่อเปิด Modal (เปลี่ยน dependencies ป้องกัน Infinite Loop)
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && editData) {
        formAddProject.reset({
          projectName: editData.name || editData.projectName || "",
          customerName: editData.client || editData.customerName || "",
          address: editData.address || "",
          mapUrl: editData.mapUrl || "",
          budget: editData.budget || ("" as unknown as number),
          startPlanned: editData.startPlanned
            ? new Date(editData.startPlanned).toISOString().split("T")[0]
            : "",
          finishPlanned: editData.finishPlanned
            ? new Date(editData.finishPlanned).toISOString().split("T")[0]
            : "",
          projectDesc: editData.projectDesc || editData.description || "",
          coverImageUrl: editData.image || editData.coverImageUrl || "",
          createdById: editData.createdById || currentUserId,
          organizationId: editData.organizationId || organizationId,
        });
        setImagePreview(editData.image || editData.coverImageUrl || null);
        setCoverImageUrl(editData.image || editData.coverImageUrl || undefined);
      } else {
        resetFormState();
      }
    }
    // ใช้ editData?.id เพื่อไม่ให้ React สับสนและรันซ้ำ
  }, [
    isOpen,
    isEditMode,
    editData?.id,
    currentUserId,
    organizationId,
    formAddProject,
  ]);

  const resetFormState = () => {
    formAddProject.reset(defaultFormValues);
    setImagePreview(null);
    setCoverImageUrl(undefined);
    setIsUploading(false);
    setIsDeleting(false);
    isSuccessRef.current = false;
  };

  const handleModalClose = async () => {
    if (isSuccessRef.current) {
      onOpenChange(false);
      resetFormState();
      return;
    }

    const originalImage = editData?.image || editData?.coverImageUrl;
    if (coverImageUrl && coverImageUrl !== originalImage) {
      setIsDeleting(true);
      try {
        const urlObj = new URL(coverImageUrl);
        let fileKey = urlObj.pathname.substring(1);
        if (fileKey.startsWith("homex/")) {
          fileKey = fileKey.replace("homex/", "");
        }
        await deleteFileS3(fileKey);
      } catch (err) {
      } finally {
        setIsDeleting(false);
      }
    }

    resetFormState();
    onOpenChange(false);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setImagePreview(URL.createObjectURL(file));

    try {
      const newImageUrl = await handleImageUpload(file, "img_projects");

      const originalImage = editData?.image || editData?.coverImageUrl;
      if (coverImageUrl && coverImageUrl !== originalImage) {
        try {
          const urlObj = new URL(coverImageUrl);
          let fileKey = urlObj.pathname.substring(1);
          if (fileKey.startsWith("homex/")) {
            fileKey = fileKey.replace("homex/", "");
          }
          await deleteFileS3(fileKey);
        } catch (err) {
          console.error("ลบรูประหว่างทางไม่สำเร็จ:", err);
        }
      }

      setCoverImageUrl(newImageUrl);
    } catch (error) {
      toast.error("อัปโหลดรูปภาพไม่สำเร็จ");
      setImagePreview(coverImageUrl || null);
    } finally {
      setIsUploading(false);
      setIsGeneratingVideo(false);
    }
  };

  const onSubmit = async (dataForm: ProjectSchema) => {
    if (isUploading) {
      toast.warning("กรุณารออัปโหลดรูปภาพสักครู่...");
      return;
    }

    if (!coverImageUrl) {
      toast.error("กรุณาอัปโหลดรูปภาพโครงการก่อนบันทึก");
      return;
    }

    try {
      const finalData: ProjectSchema = {
        ...dataForm,
        createdById: currentUserId,
        organizationId: organizationId,
        coverImageUrl: coverImageUrl,
      };

      startTransition(async () => {
        if (isEditMode) {
          // --- โหมดแก้ไข ---
          const res = await updateProject(editData.id, finalData);
          if (res?.success || !res?.error) {
            const originalImage = editData?.image || editData?.coverImageUrl;
            if (originalImage && coverImageUrl !== originalImage) {
              try {
                const urlObj = new URL(originalImage);
                let fileKey = urlObj.pathname.substring(1);
                if (fileKey.startsWith("homex/")) {
                  fileKey = fileKey.replace("homex/", "");
                }
                await deleteFileS3(fileKey);
              } catch (err) {}
            }

            toast.success("บันทึกการแก้ไขเรียบร้อย!");
            router.refresh();
            isSuccessRef.current = true;
            onOpenChange(false);
          } else {
            toast.error(res?.error || "แก้ไขข้อมูลไม่สำเร็จ");
          }
        } else {

          const dummyState = { success: false, error: false, message: "" };
          const res = await createProject(dummyState, finalData);

          if (res?.success) {
            toast.success("สร้างโครงการเรียบร้อย!");
            router.refresh();
            isSuccessRef.current = true;
            onOpenChange(false);
          } else {
            toast.error(res?.message || "บันทึกไม่สำเร็จ");
          }
        }
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    }
  };


  const isBusy = isPending || isUploading || isDeleting;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleModalClose();
        } else {
          onOpenChange(true);
        }
      }}
      scrollBehavior="inside"
      placement="center"
      backdrop="blur"
      isDismissable={false}
      hideCloseButton={isBusy}
      classNames={{
        wrapper: "z-[9999]",
        base: `mx-4 w-full max-w-3xl max-h-[90dvh] rounded-2xl bg-white dark:bg-[#18181b] shadow-2xl`,
        header: "border-b border-default-100 p-4 sm:p-6",
        body: "p-4 sm:p-6 gap-6",
        footer: "border-t border-default-100 p-4 sm:p-6",
        closeButton: "hover:bg-default-100 active:bg-default-200",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-row items-center gap-3">
              <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl shrink-0 border border-orange-100 dark:border-orange-500/20">
                <Building2 className="text-orange-500" size={24} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  {isEditMode ? "Edit Project" : "Create Project"}
                </h2>
                <p className="text-default-400 text-xs font-normal">
                  {isEditMode ? "แก้ไขข้อมูลโครงการ" : "สร้างโครงการใหม่"}
                </p>
              </div>
            </ModalHeader>

            <form
              onSubmit={formAddProject.handleSubmit(onSubmit)}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <ModalBody>
                <div className="relative group w-full h-48 sm:h-56 rounded-2xl border-2 border-dashed border-default-200 hover:border-primary transition-all bg-default-50/50 dark:bg-default-100/10 overflow-hidden cursor-pointer shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isBusy}
                    className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer disabled:cursor-not-allowed"
                  />

                  {(isUploading || isDeleting || isGeneratingVideo) && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                      <Spinner color="warning" />
                      <span className="text-white text-xs mt-2 font-medium text-center px-4">
                        {isDeleting
                          ? "กำลังลบรูป..."
                          : isGeneratingVideo
                            ? "AI กำลังสร้างวิดีโอ (อาจใช้เวลา 1-3 นาที)..."
                            : "กำลังอัปโหลดรูป..."}
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
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <span className="text-white font-medium flex gap-2">
                            <ImageIcon /> เปลี่ยนรูปภาพ
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-default-400 gap-3">
                      <div className="p-4 bg-white dark:bg-zinc-800 rounded-full shadow-sm">
                        <UploadCloud size={32} className="text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                          อัปโหลดรูปโครงการ{" "}
                          <span className="text-danger">*</span>
                        </p>
                        <p className="text-xs">JPG, PNG ไม่เกิน 10MB</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Input
                    isRequired
                    label="ชื่อโครงการ"
                    placeholder="ระบุชื่อโครงการ"
                    labelPlacement="outside"
                    variant="bordered"
                    startContent={
                      <Building2 className="text-default-400" size={18} />
                    }
                    {...formAddProject.register("projectName")}
                  />
                  <Input
                    isRequired
                    label="ชื่อลูกค้า"
                    placeholder="ระบุชื่อลูกค้า"
                    labelPlacement="outside"
                    variant="bordered"
                    startContent={
                      <User className="text-default-400" size={18} />
                    }
                    {...formAddProject.register("customerName")}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Input
                    label="สถานที่"
                    placeholder="ระบุพิกัด"
                    labelPlacement="outside"
                    variant="bordered"
                    startContent={
                      <MapPin className="text-default-400" size={18} />
                    }
                    {...formAddProject.register("address")}
                  />
                  <Input
                    isRequired
                    type="number"
                    label="งบประมาณ"
                    labelPlacement="outside"
                    variant="bordered"
                    startContent={
                      <Wallet className="text-default-400" size={18} />
                    }
                    endContent={
                      <span className="text-default-400 text-xs">THB</span>
                    }
                    {...formAddProject.register("budget")}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Input
                    isRequired
                    type="date"
                    label="เริ่มสัญญา"
                    labelPlacement="outside"
                    variant="bordered"
                    {...formAddProject.register("startPlanned")}
                  />
                  <Input
                    isRequired
                    type="date"
                    label="สิ้นสุดสัญญา"
                    labelPlacement="outside"
                    variant="bordered"
                    {...formAddProject.register("finishPlanned")}
                  />
                </div>
                <Textarea
                  label="รายละเอียด"
                  placeholder="ระบุขอบเขตงาน..."
                  labelPlacement="outside"
                  variant="bordered"
                  minRows={3}
                  {...formAddProject.register("projectDesc")}
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
                  color="primary"
                  radius="full"
                  className="w-full sm:w-auto h-12 sm:h-10 font-medium bg-black text-white dark:bg-white dark:text-black shadow-lg"
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
                          : "สร้างโครงการ"}
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default CreateProject;
