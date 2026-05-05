"use client";

import { useState, useMemo } from "react";
import { Modal, ModalContent, ModalBody } from "@heroui/react";
import { FileText, Image as ImageIcon, ExternalLink } from "lucide-react";

interface TaskV2SubmitResultTabProps {
  submitNote: string | null;
  submitImages: string | null;
}

const TaskV2SubmitResultTab = ({
  submitNote,
  submitImages,
}: TaskV2SubmitResultTabProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const images: string[] = useMemo(() => {
    if (!submitImages) return [];
    try {
      return JSON.parse(submitImages);
    } catch {
      return [];
    }
  }, [submitImages]);

  // Detect URLs in text and render as links
  const renderNote = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) =>
      urlRegex.test(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1 break-all"
        >
          {part}
          <ExternalLink size={12} className="shrink-0" />
        </a>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Note Section */}
      {submitNote && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <FileText size={16} />
            <h4 className="font-bold text-sm">หมายเหตุ / ผลงาน</h4>
          </div>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {renderNote(submitNote)}
          </p>
        </div>
      )}

      {/* Images Section */}
      {images.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <ImageIcon size={16} />
            <h4 className="font-bold text-sm">รูปผลงาน ({images.length} รูป)</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((url, i) => (
              <button
                key={i}
                onClick={() => setPreviewUrl(url)}
                className="aspect-square rounded-xl overflow-hidden border border-zinc-700 hover:border-primary transition-colors group"
              >
                <img
                  src={url}
                  alt={`ผลงาน ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {!submitNote && images.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
            <FileText size={20} className="text-zinc-500" />
          </div>
          <p className="text-zinc-400 text-sm font-medium">ไม่มีข้อมูลผลงาน</p>
        </div>
      )}

      {/* Image Preview Modal */}
      <Modal
        isOpen={!!previewUrl}
        onOpenChange={(open) => !open && setPreviewUrl(null)}
        size="4xl"
        placement="center"
        classNames={{
          base: "bg-black/95 rounded-2xl",
          closeButton: "text-white hover:bg-white/20 z-50",
          body: "p-0",
        }}
      >
        <ModalContent>
          <ModalBody className="flex items-center justify-center p-2">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="ตัวอย่างรูป"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default TaskV2SubmitResultTab;
