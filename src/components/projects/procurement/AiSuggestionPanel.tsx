"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Button, Chip, Spinner, Tooltip } from "@heroui/react";
import { Sparkles, Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "react-toastify";
import {
  getProcurementSuggestions,
  convertSuggestionToProcurement,
  deleteProcurementSuggestion,
} from "@/lib/actions/actionProcurementSuggestion";

interface SuggestionItem {
  id: number;
  materialName: string;
  specification: string | null;
  quantity: string | null;
  unit: string | null;
  unitPrice: number | null;
  totalPrice: number | null;
  status: string;
  createdAt: string;
  taskId: number;
  taskName: string | null;
  taskCoverImage: string | null;
  creatorName: string | null;
}

interface AiSuggestionPanelProps {
  projectId: number;
  onItemConverted: () => void;
}

const AiSuggestionPanel = ({
  projectId,
  onItemConverted,
}: AiSuggestionPanelProps) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [convertingId, setConvertingId] = useState<number | null>(null);

  const loadSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getProcurementSuggestions(projectId);
      setSuggestions(data as SuggestionItem[]);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleConvert = (id: number) => {
    setConvertingId(id);
    startTransition(async () => {
      const res = await convertSuggestionToProcurement(id);
      if (res.success) {
        toast.success(res.message || "เพิ่มลงรายการจัดซื้อสำเร็จ");
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        onItemConverted();
      } else {
        toast.error(res.message || "เพิ่มไม่สำเร็จ");
      }
      setConvertingId(null);
    });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      const res = await deleteProcurementSuggestion(id);
      if (res.success) {
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
        toast.success("ลบรายการสำเร็จ");
      } else {
        toast.error(res.message || "ลบไม่สำเร็จ");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="sm" color="primary" />
        <span className="ml-2 text-sm text-default-400">กำลังโหลดรายการแนะนำ...</span>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-warning" />
          <h3 className="font-bold text-base">รายการแนะนำจาก AI</h3>
          <Chip size="sm" variant="flat" color="warning">
            {suggestions.length} รายการ
          </Chip>
        </div>
        <Button
          size="sm"
          variant="light"
          color="primary"
          onPress={loadSuggestions}
          className="text-xs"
        >
          รีเฟรช
        </Button>
      </div>

      <p className="text-xs text-default-400">
        รายการวัสดุจากการวิเคราะห์ AI ในงาน V2 — กดปุ่ม "เพิ่มลงจัดซื้อ" เพื่อสร้างเป็นรายการจัดซื้อจริง
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-warning/30 bg-warning-50/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-warning/20 bg-warning-50/10">
              <th className="text-left px-3 py-2.5 text-[11px] font-bold text-default-500 uppercase">
                รายการวัสดุ
              </th>
              <th className="text-left px-3 py-2.5 text-[11px] font-bold text-default-500 uppercase">
                จากงาน
              </th>
              <th className="text-center px-3 py-2.5 text-[11px] font-bold text-default-500 uppercase">
                จำนวน
              </th>
              <th className="text-center px-3 py-2.5 text-[11px] font-bold text-default-500 uppercase">
                หน่วย
              </th>
              <th className="text-right px-3 py-2.5 text-[11px] font-bold text-default-500 uppercase">
                ราคาประเมิน (AI)
              </th>
              <th className="text-right px-3 py-2.5 text-[11px] font-bold text-default-500 uppercase">
                รวม
              </th>
              <th className="text-center px-3 py-2.5 text-[11px] font-bold text-default-500 uppercase">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s) => {
              const isConverting = convertingId === s.id;
              return (
                <tr
                  key={s.id}
                  className="border-b border-default-100 dark:border-zinc-800 hover:bg-default-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-3 py-2.5">
                    <div>
                      <p className="font-medium text-sm">{s.materialName}</p>
                      {s.specification && s.specification !== s.materialName && (
                        <p className="text-[11px] text-default-400 truncate max-w-[200px]">
                          {s.specification}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Chip size="sm" variant="flat" color="primary" className="text-[10px]">
                      {s.taskName || `Task #${s.taskId}`}
                    </Chip>
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs">
                    {s.quantity || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs text-default-500">
                    {s.unit || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-default-500">
                    {s.unitPrice != null
                      ? `${s.unitPrice.toLocaleString("th-TH")} ฿`
                      : "-"}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs font-semibold text-warning">
                    {s.totalPrice != null
                      ? `${s.totalPrice.toLocaleString("th-TH")} ฿`
                      : "-"}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        color="success"
                        variant="flat"
                        isLoading={isConverting}
                        startContent={
                          !isConverting ? <Plus size={14} /> : undefined
                        }
                        onPress={() => handleConvert(s.id)}
                        className="text-[11px] font-medium"
                      >
                        เพิ่มลงจัดซื้อ
                      </Button>
                      <Tooltip content="ลบ">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          isDisabled={isPending}
                          onPress={() => handleDelete(s.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AiSuggestionPanel;
