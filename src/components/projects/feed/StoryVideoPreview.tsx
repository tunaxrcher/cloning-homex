"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button, Textarea } from "@heroui/react";
import { X, Upload } from "lucide-react";
import type { StoryVideoPreviewProps } from "@/lib/type";

export default function StoryVideoPreview({
  videoFile,
  videoUrl,
  onUpload,
  onCancel,
  isUploading,
}: StoryVideoPreviewProps) {
  const [caption, setCaption] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (videoUrl) {
      setPreviewUrl(videoUrl);
    }
  }, [videoFile, videoUrl]);

  if (!previewUrl) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/60 backdrop-blur-sm">
        <Button
          isIconOnly
          variant="light"
          onPress={onCancel}
          isDisabled={isUploading}
          className="text-white"
        >
          <X size={24} />
        </Button>
        <h3 className="text-white font-semibold text-base">พรีวิววิดีโอ</h3>
        <div className="w-10" />
      </div>

      {/* Video Preview */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-4">
        <video
          ref={videoRef}
          src={previewUrl}
          className="max-h-full max-w-full rounded-2xl object-contain"
          controls
          autoPlay
          muted
          playsInline
        />
      </div>

      {/* Caption + Actions */}
      <div className="p-4 bg-black/60 backdrop-blur-sm space-y-3">
        <Textarea
          placeholder="เขียนแคปชัน... (เสริม)"
          value={caption}
          onValueChange={setCaption}
          maxRows={3}
          classNames={{
            inputWrapper: "bg-white/10 border-white/20 backdrop-blur-sm",
            input: "text-white placeholder:text-white/50",
          }}
        />
        <div className="flex gap-3">
          <Button
            variant="bordered"
            className="flex-1 text-white border-white/30"
            onPress={onCancel}
            isDisabled={isUploading}
          >
            ยกเลิก
          </Button>
          <Button
            color="primary"
            className="flex-1 font-bold"
            onPress={() => onUpload(caption)}
            isDisabled={isUploading}
            isLoading={isUploading}
            startContent={!isUploading ? <Upload size={18} /> : undefined}
          >
            {isUploading ? "กำลังอัปโหลด..." : "อัปโหลดสตอรี่"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
