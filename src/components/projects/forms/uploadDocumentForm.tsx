"use client";

import React, { useState, useRef, useTransition } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { Upload } from "lucide-react";
import { toast } from "react-toastify";
import { createDocFile } from "@/lib/actions/actionProject";
import { sendbase64toS3DataVdo } from "@/lib/actions/actionIndex";
import { UploadModalDocProps } from "@/lib/type";
import { PROJECT_DOC_TYPES } from "@/lib/setting_data";
import { useRouter } from "next/navigation";

const UploadDocumentForm = ({
  isOpen,
  onOpenChange,
  projectId,
  organizationId,
  currentUserId,
  onSuccess,
}: UploadModalDocProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [docType, setDocType] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("อนุญาตเฉพาะไฟล์ PDF, Word, Excel และรูปภาพเท่านั้น");
        return;
      }

      if (selectedFile.size > 30 * 1024 * 1024) {
        toast.error("ไฟล์ขนาดใหญ่เกินไป (สูงสุด 30MB)");
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.warning("กรุณาเลือกไฟล์ก่อนอัปโหลด");
    if (!docType) return toast.warning("กรุณาเลือกประเภทเอกสาร");

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const s3Res = await sendbase64toS3DataVdo(formData, `doc_project`);

      if (!s3Res.success || !s3Res.url) {
        throw new Error(String(s3Res.error) || "อัปโหลดไฟล์ไม่สำเร็จ");
      }

      const dbRes = await createDocFile({
        fileName: file.name,
        fileUrl: s3Res.url,
        fileType: docType,
        note: note,
        organizationId: Number(organizationId),
        projectId: Number(projectId),
        uploadedById: Number(currentUserId),
      });

      if (!dbRes.success) {
        throw new Error(String(dbRes.message) || "บันทึกข้อมูลไม่สำเร็จ");
      }

      toast.success("อัปโหลดและบันทึกเอกสารเรียบร้อยแล้ว");

      onOpenChange(false);
      setFile(null);
      setDocType("");
      setNote("");

      startTransition(() => {
        if (onSuccess) onSuccess();
        router.refresh();
      });
    } catch (error: any) {
      console.error("Upload Error:", error);
      toast.error(error.message || "เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setIsUploading(false);
    }
  };
  const clearForm = () => {
    setFile(null);
    setDocType("");
    setNote("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    clearForm();
    onOpenChange(false);
  };
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onClose={clearForm}
      placement="center"
      backdrop="blur"
      className="dark text-foreground"
    >
      <ModalContent className="mx-4">
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 pb-2">
              <h2 className="text-xl font-bold text-white">
                อัปโหลดเอกสารใหม่
              </h2>
              <p className="text-xs font-normal text-default-400">
                เลือกไฟล์ที่ต้องการบันทึกเข้าสู่โปรเจกต์
              </p>
            </ModalHeader>

            <ModalBody className="py-4">
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-default-700 ml-1">
                    ประเภทเอกสาร
                  </label>
                  <Select
                    variant="bordered"
                    placeholder="เลือกประเภทเอกสาร"
                    selectedKeys={docType ? [docType] : []}
                    onSelectionChange={(keys) =>
                      setDocType(Array.from(keys)[0] as string)
                    }
                    classNames={{
                      trigger: "h-12 border-default-200 dark:border-zinc-700",
                      value: "text-sm font-medium",
                    }}
                  >
                    {PROJECT_DOC_TYPES.map((type) => (
                      <SelectItem key={type.key} textValue={type.textValue}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-default-700 ml-1">
                    ชื่อเอกสาร (ระบุเพิ่มเติม)
                  </label>
                  <Input
                    value={note}
                    onValueChange={setNote}
                    placeholder="เช่น ใบงวดงานที่ 1, ผังวงจรไฟฟ้า"
                    variant="bordered"
                    classNames={{
                      inputWrapper:
                        "h-12 border-default-200 dark:border-zinc-700",
                      input: "text-sm font-medium",
                    }}
                  />
                </div>

                {/* Dropzone Area */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                  onChange={handleFileChange}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-zinc-700 rounded-2xl p-10 bg-zinc-900/30 flex flex-col items-center gap-3 active:opacity-70 transition-opacity"
                >
                  <div className="p-4 bg-primary/10 rounded-full text-primary mb-1">
                    <Upload size={28} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white text-center truncate max-w-[250px]">
                      {file ? file.name : "กดเพื่อเลือกไฟล์ หรือลากวางที่นี่"}
                    </p>
                    <p className="text-[11px] font-medium text-default-400 mt-1 uppercase tracking-wider">
                      PDF, Word, Excel, Image (สูงสุด 30MB)
                    </p>
                  </div>
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="pt-2 pb-6">
              <Button
                variant="light"
                className="font-semibold text-default-500"
                onPress={handleClose}
                isDisabled={isUploading}
              >
                ยกเลิก
              </Button>
              <Button
                color="primary"
                className="font-bold px-8 shadow-lg shadow-primary/20 bg-blue-600"
                onPress={handleUpload}
                isLoading={isUploading}
                isDisabled={!file || !docType || !note.trim()}
              >
                ยืนยันการอัปโหลด
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default UploadDocumentForm;
