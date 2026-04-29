"use client";

import { useState, useEffect } from "react";
import { Button, Chip } from "@heroui/react";
import { ShoppingCart, Plus, Check } from "lucide-react";
import type { TaskV2Material } from "@/lib/type";
import { toast } from "react-toastify";
import { getAddedMaterialNames } from "@/lib/actions/actionProcurementSuggestion";

interface TaskV2ProcurementTabProps {
  materials: TaskV2Material[];
  taskId?: number;
  onAddToProcurement?: (material: TaskV2Material) => Promise<boolean>;
}

const TaskV2ProcurementTab = ({
  materials,
  taskId,
  onAddToProcurement,
}: TaskV2ProcurementTabProps) => {
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set());
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!taskId) return;
    getAddedMaterialNames(taskId).then((names) => {
      setAddedNames(new Set(names));
    });
  }, [taskId]);

  const handleAdd = async (mat: TaskV2Material, index: number) => {
    if (!onAddToProcurement || addedNames.has(mat.spec)) return;
    setLoadingIndex(index);
    try {
      const ok = await onAddToProcurement(mat);
      if (ok) {
        setAddedNames((prev) => new Set(prev).add(mat.spec));
        toast.success(`เพิ่ม "${mat.spec}" ไปที่จัดซื้อแล้ว`);
      }
    } finally {
      setLoadingIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShoppingCart className="text-primary" size={18} />
        <h3 className="font-bold text-sm">
          รายการวัสดุจาก AI
        </h3>
        <Chip size="sm" variant="flat" color="primary" className="ml-1">
          {materials.length} รายการ
        </Chip>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              <th className="text-left p-3 text-xs font-bold text-zinc-400 uppercase">
                รายการวัสดุ (SPEC)
              </th>
              <th className="text-center p-3 text-xs font-bold text-zinc-400 uppercase">
                ปริมาณ (รวม WASTE)
              </th>
              <th className="text-center p-3 text-xs font-bold text-zinc-400 uppercase">
                ราคาประเมิน (AI)
              </th>
              <th className="text-right p-3 text-xs font-bold text-zinc-400 uppercase">
                รวมเป็นเงิน
              </th>
              <th className="text-center p-3 text-xs font-bold text-zinc-400 uppercase">
                จัดซื้อ
              </th>
            </tr>
          </thead>
          <tbody>
            {materials.map((mat, i) => {
              const isAdded = addedNames.has(mat.spec);
              const isLoading = loadingIndex === i;
              return (
                <tr
                  key={i}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="p-3 font-medium">{mat.spec}</td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {mat.quantity}
                    </span>
                  </td>
                  <td className="p-3 text-center text-zinc-400">
                    {mat.unitPrice.toLocaleString("th-TH")} ฿/{mat.unit}
                  </td>
                  <td className="p-3 text-right font-bold text-warning">
                    {mat.totalPrice.toLocaleString("th-TH")} ฿
                  </td>
                  <td className="p-3 text-center">
                    {isAdded ? (
                      <Chip size="sm" color="success" variant="flat" startContent={<Check size={12} />}>
                        ถูกเพิ่มลงจัดซื้อแล้ว
                      </Chip>
                    ) : (
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        isLoading={isLoading}
                        startContent={!isLoading ? <Plus size={14} /> : undefined}
                        onPress={() => handleAdd(mat, i)}
                        className="text-xs font-medium"
                      >
                        เพิ่ม
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-zinc-900/80">
              <td colSpan={3} className="p-3 text-right font-bold text-xs uppercase text-zinc-400">
                รวมทั้งหมด
              </td>
              <td className="p-3 text-right font-bold text-primary text-base">
                {materials
                  .reduce((sum, m) => sum + m.totalPrice, 0)
                  .toLocaleString("th-TH")}{" "}
                ฿
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {materials.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <ShoppingCart size={32} className="mb-2 opacity-50" />
          <p className="text-sm">ยังไม่มีรายการวัสดุ</p>
        </div>
      )}
    </div>
  );
};

export default TaskV2ProcurementTab;
