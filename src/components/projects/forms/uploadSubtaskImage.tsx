"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from "@heroui/react";

import { UploadCloud, Image as ImageIcon } from "lucide-react";
import { handleImageUpload, deleteFileS3 } from "@/lib/actions/actionIndex";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  subtaskId: number | null;
  onSuccess: (imageUrl: string) => void;
};

export default function UploadSubtaskImage({
  isOpen,
  onClose,
  subtaskId,
  onSuccess,
}: Props) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetState = () => {
    setImagePreview(null);
    setImageUrl(undefined);
    setIsUploading(false);
    setIsDeleting(false);
  };

  const handleClose = async (isSuccess = false) => {
    // ❌ cancel → ลบรูป
    if (!isSuccess && imageUrl) {
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

    resetState();
    onClose();
  };

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setImagePreview(URL.createObjectURL(file));

    try {
      const uploaded = await handleImageUpload(file, "img_subtasks");
      setImageUrl(uploaded);
    } catch {
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose(false);
      }}
      placement="center"
      backdrop="blur"
      isDismissable={false}
      isKeyboardDismissDisabled
    >
      <ModalContent>
        <ModalHeader>อัปโหลดรูปงาน</ModalHeader>

        <ModalBody>
          <div className="relative group w-full h-44 rounded-2xl border-2 border-dashed border-default-200 hover:border-primary transition-all bg-default-50/50 overflow-hidden cursor-pointer">

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 z-20 cursor-pointer"
            />

            {(isUploading || isDeleting) && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                <Spinner color="warning" />
                <span className="text-white text-xs mt-2">
                  {isDeleting
                    ? "กำลังลบรูป..."
                    : "กำลังอัปโหลดรูป..."}
                </span>
              </div>
            )}

            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <span className="text-white flex gap-2">
                    <ImageIcon /> เปลี่ยนรูป
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <UploadCloud size={28} className="text-primary" />
                <p className="text-xs text-default-400">
                  อัปโหลดรูปงาน
                </p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="light"
            color="danger"
            onPress={() => handleClose(false)}
            isDisabled={isUploading || isDeleting}
          >
            ยกเลิก
          </Button>

          <Button
            color="primary"
            isDisabled={!imageUrl || isUploading || isDeleting}
            onPress={() => {
              if (!imageUrl) return;

              // ✅ ส่งกลับไปให้ parent จัดการ DB
              onSuccess(imageUrl);

              handleClose(true);
            }}
          >
            บันทึก
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}