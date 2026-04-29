"use client";

import { useState, useRef, useTransition } from "react";
import {
  Button,
  Chip,
  Spinner,
  Modal,
  ModalContent,
  ModalBody,
} from "@heroui/react";
import {
  Upload,
  Sparkles,
  Check,
  X,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { extractMaterialsFromImage } from "@/lib/ai/geminiAI";
import { createManyProcurementItems } from "@/lib/actions/actionProcurement";

interface ExtractedMaterial {
  materialName: string;
  specification: string;
  unit: string;
  quantity: number | null;
  partType: string;
  materialGroup: string;
  note: string;
  selected: boolean;
}

interface AiMaterialExtractorProps {
  projectId: number;
  organizationId: number;
  onSuccess: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const AiMaterialExtractor = ({
  projectId,
  organizationId,
  onSuccess,
}: AiMaterialExtractorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, startTransition] = useTransition();
  const [extractedItems, setExtractedItems] = useState<ExtractedMaterial[]>([]);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์ JPG, PNG, WebP หรือ PDF เท่านั้น");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("ขนาดไฟล์ใหญ่เกิน 10MB กรุณาลดขนาดก่อนอัปโหลด");
      return;
    }

    setFileName(file.name);
    setIsExtracting(true);
    setIsOpen(true);
    setExtractedItems([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      const materials = await extractMaterialsFromImage(base64, file.type);

      if (materials && materials.length > 0) {
        setExtractedItems(
          materials.map((m: any) => ({ ...m, selected: true })),
        );
        toast.success(`AI พบ ${materials.length} รายการวัสดุ`);
      } else {
        toast.warning("AI ไม่พบรายการวัสดุในเอกสารนี้");
        setIsOpen(false);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการวิเคราะห์เอกสาร");
      setIsOpen(false);
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleItem = (idx: number) => {
    setExtractedItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  const toggleAll = () => {
    const allSelected = extractedItems.every((i) => i.selected);
    setExtractedItems((prev) =>
      prev.map((item) => ({ ...item, selected: !allSelected })),
    );
  };

  const handleSaveSelected = async () => {
    const selected = extractedItems.filter((i) => i.selected);
    if (selected.length === 0) {
      toast.warning("กรุณาเลือกอย่างน้อย 1 รายการ");
      return;
    }

    startTransition(async () => {
      const res = await createManyProcurementItems(
        selected.map((item, idx) => ({
          materialName: item.materialName,
          specification: item.specification || undefined,
          unit: item.unit || undefined,
          quantity: item.quantity ?? undefined,
          partType: item.partType,
          materialGroup: item.materialGroup,
          note: item.note || undefined,
          sortOrder: idx,
          projectId,
          organizationId,
        })),
      );

      if (res.success) {
        toast.success(`บันทึก ${selected.length} รายการสำเร็จ`);
        setIsOpen(false);
        setExtractedItems([]);
        onSuccess();
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    });
  };

  const selectedCount = extractedItems.filter((i) => i.selected).length;

  return (
    <>
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileSelect}
          disabled={isExtracting}
        />
        <Button
          color="secondary"
          variant="flat"
          radius="full"
          className="font-bold"
          startContent={<Sparkles size={16} />}
          isLoading={isExtracting}
        >
          {isExtracting ? "AI กำลังวิเคราะห์..." : "AI อ่านเอกสาร (In Development)"}
        </Button>
      </div>

      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open && !isExtracting) {
            setIsOpen(false);
            setExtractedItems([]);
          }
        }}
        size="4xl"
        placement="center"
        isDismissable={!isExtracting}
        classNames={{
          base: "max-h-[90vh] rounded-2xl",
          closeButton: "top-3 right-3",
        }}
      >
        <ModalContent>
          <ModalBody className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Sparkles size={20} className="text-secondary" />
                  AI แยกรายการวัสดุ
                </h3>
                <p className="text-xs text-default-400 mt-1">
                  {fileName && (
                    <span className="flex items-center gap-1">
                      <FileText size={12} /> {fileName}
                    </span>
                  )}
                </p>
              </div>
              {!isExtracting && extractedItems.length > 0 && (
                <div className="flex items-center gap-2">
                  <Chip size="sm" variant="flat" color="primary">
                    เลือก {selectedCount}/{extractedItems.length}
                  </Chip>
                  <Button size="sm" variant="flat" onPress={toggleAll}>
                    {extractedItems.every((i) => i.selected) ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </Button>
                </div>
              )}
            </div>

            {/* Loading */}
            {isExtracting && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Spinner color="secondary" size="lg" />
                <p className="text-sm text-default-500 animate-pulse">
                  AI กำลังวิเคราะห์เอกสาร...
                </p>
              </div>
            )}

            {/* Extracted Items Table */}
            {!isExtracting && extractedItems.length > 0 && (
              <>
                <div className="overflow-x-auto max-h-[50vh] overflow-y-auto rounded-xl border border-default-200">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-default-100 dark:bg-zinc-800">
                        <th className="px-2 py-2 text-center w-10">เลือก</th>
                        <th className="px-2 py-2 text-left">ชื่อวัสดุ</th>
                        <th className="px-2 py-2 text-left">Spec</th>
                        <th className="px-2 py-2 text-center">จำนวน</th>
                        <th className="px-2 py-2 text-center">หน่วย</th>
                        <th className="px-2 py-2 text-center">ประเภท</th>
                        <th className="px-2 py-2 text-center">กลุ่ม</th>
                        <th className="px-2 py-2 text-left">หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extractedItems.map((item, idx) => (
                        <tr
                          key={idx}
                          className={`border-b border-default-100 cursor-pointer hover:bg-default-50 ${
                            item.selected ? "" : "opacity-40"
                          }`}
                          onClick={() => toggleItem(idx)}
                        >
                          <td className="px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => toggleItem(idx)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-2 py-2 font-medium max-w-[200px] truncate">
                            {item.materialName}
                          </td>
                          <td className="px-2 py-2 text-default-500 max-w-[150px] truncate">
                            {item.specification || "-"}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {item.quantity != null ? item.quantity.toLocaleString() : "-"}
                          </td>
                          <td className="px-2 py-2 text-center">{item.unit || "-"}</td>
                          <td className="px-2 py-2 text-center">
                            <Chip size="sm" variant="flat" className="text-[10px]">
                              {item.partType}
                            </Chip>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <Chip size="sm" variant="flat" className="text-[10px]">
                              {item.materialGroup}
                            </Chip>
                          </td>
                          <td className="px-2 py-2 text-default-400 max-w-[120px] truncate">
                            {item.note || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="flat"
                    onPress={() => {
                      setIsOpen(false);
                      setExtractedItems([]);
                    }}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    color="primary"
                    startContent={<Check size={16} />}
                    onPress={handleSaveSelected}
                    isLoading={isSaving}
                    isDisabled={selectedCount === 0}
                  >
                    บันทึก {selectedCount} รายการ
                  </Button>
                </div>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AiMaterialExtractor;
