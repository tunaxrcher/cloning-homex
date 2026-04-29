"use client";

import { useState, useRef, useTransition } from "react";
import {
  Button,
  Tooltip,
  Modal,
  ModalContent,
  ModalBody,
} from "@heroui/react";
import { ImagePlus, Trash2, X, ZoomIn } from "lucide-react";
import { toast } from "react-toastify";
import type { ProcurementItemImage } from "@/lib/type";
import {
  addProcurementItemImage,
  deleteProcurementItemImage,
} from "@/lib/actions/actionProcurement";
import { uploadImageFormData } from "@/lib/actions/actionIndex";

interface ImageGalleryProps {
  itemId: number;
  images: ProcurementItemImage[];
  onRefresh: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const ImageGallery = ({ itemId, images, onRefresh }: ImageGalleryProps) => {
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.warning(`${file.name}: รองรับเฉพาะ JPG, PNG, WebP`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.warning(`${file.name}: ขนาดเกิน 5MB`);
        continue;
      }

      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("path", `procurement/${itemId}`);
        const uploadRes = await uploadImageFormData(fd);
        if (!uploadRes.success || !uploadRes.url) continue;

        const saveRes = await addProcurementItemImage(itemId, uploadRes.url);
        if (saveRes.success) successCount++;
      } catch {
        toast.error(`อัปโหลด ${file.name} ไม่สำเร็จ`);
      }
    }

    if (successCount > 0) {
      toast.success(`อัปโหลด ${successCount} รูปสำเร็จ`);
      onRefresh();
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm("ต้องการลบรูปนี้ใช่หรือไม่?")) return;
    startTransition(async () => {
      const res = await deleteProcurementItemImage(imageId);
      if (res.success) {
        toast.success("ลบรูปสำเร็จ");
        onRefresh();
      } else {
        toast.error(res.message || "ลบรูปไม่สำเร็จ");
      }
    });
  };

  return (
    <div className="space-y-2 mt-3 pt-3 border-t border-default-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-bold text-default-500 uppercase flex items-center gap-1">
          <ImagePlus size={14} /> รูปอ้างอิง ({images.length})
        </h5>
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <Button
            size="sm"
            variant="flat"
            color="primary"
            startContent={<ImagePlus size={12} />}
            isLoading={isUploading}
          >
            {isUploading ? "กำลังอัปโหลด..." : "เพิ่มรูป"}
          </Button>
        </div>
      </div>

      {/* Image Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square rounded-lg overflow-hidden border border-default-200 bg-default-50"
            >
              <img
                src={img.imageUrl}
                alt={img.caption || "รูปวัสดุ"}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setPreviewUrl(img.imageUrl)}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                <Tooltip content="ดูใหญ่">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    className="bg-white/80 text-black"
                    onPress={() => setPreviewUrl(img.imageUrl)}
                  >
                    <ZoomIn size={14} />
                  </Button>
                </Tooltip>
                <Tooltip content="ลบ" color="danger">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    className="bg-white/80 text-danger"
                    onPress={() => handleDelete(img.id)}
                    isLoading={isPending}
                  >
                    <Trash2 size={14} />
                  </Button>
                </Tooltip>
              </div>
              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
                  <p className="text-[10px] text-white truncate">{img.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-default-400 text-center py-2">
          ยังไม่มีรูปอ้างอิง
        </p>
      )}

      {/* Full Preview Modal */}
      <Modal
        isOpen={!!previewUrl}
        onOpenChange={(open) => {
          if (!open) setPreviewUrl(null);
        }}
        size="4xl"
        placement="center"
        classNames={{
          base: "bg-black/90 rounded-2xl",
          closeButton: "text-white top-3 right-3 z-50",
        }}
      >
        <ModalContent>
          <ModalBody className="p-2 flex items-center justify-center min-h-[400px]">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ImageGallery;
