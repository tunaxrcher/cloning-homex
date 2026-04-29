"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  Button,
  Chip,
  Spinner,
  Modal,
  ModalContent,
  ModalBody,
  Tooltip,
} from "@heroui/react";
import {
  FileText,
  Plus,
  Check,
  Send,
  Package,
  XCircle,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import type { ProcurementItemData } from "@/lib/type";
import {
  generatePurchaseOrder,
  getPurchaseOrders,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
} from "@/lib/actions/actionProcurement";

const PO_STATUS_MAP: Record<string, { label: string; color: "default" | "primary" | "success" | "warning" | "danger" | "secondary" }> = {
  DRAFT: { label: "แบบร่าง", color: "default" },
  APPROVED: { label: "อนุมัติ", color: "primary" },
  SENT: { label: "ส่งแล้ว", color: "secondary" },
  RECEIVED: { label: "รับของแล้ว", color: "success" },
  CANCELLED: { label: "ยกเลิก", color: "danger" },
};

interface PurchaseOrderPanelProps {
  projectId: number;
  items: ProcurementItemData[];
  suppliers: { id: number; supplierName: string }[];
}

const PurchaseOrderPanel = ({
  projectId,
  items,
  suppliers,
}: PurchaseOrderPanelProps) => {
  const [isPending, startTransition] = useTransition();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Create PO form
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [poNote, setPoNote] = useState("");

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPurchaseOrders(projectId);
      setOrders(data);
    } catch {
      toast.error("โหลดข้อมูล PO ไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Filter items that have a selected quote for the chosen supplier
  const eligibleItems = items.filter((item) => {
    if (!selectedSupplierId) return false;
    return item.quotes.some(
      (q) => q.supplierId === Number(selectedSupplierId) && q.isSelected,
    );
  });

  const toggleItemSelection = (id: number) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllEligible = () => {
    if (selectedItemIds.size === eligibleItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(eligibleItems.map((i) => i.id)));
    }
  };

  const handleCreatePO = async () => {
    if (!selectedSupplierId) {
      toast.warning("กรุณาเลือก Supplier");
      return;
    }
    if (selectedItemIds.size === 0) {
      toast.warning("กรุณาเลือกรายการวัสดุ");
      return;
    }

    startTransition(async () => {
      const res = await generatePurchaseOrder(
        projectId,
        Number(selectedSupplierId),
        Array.from(selectedItemIds),
        poNote || undefined,
      );

      if (res.success) {
        toast.success(`สร้างใบสั่งซื้อ ${res.message} สำเร็จ`);
        setIsCreating(false);
        setSelectedSupplierId("");
        setSelectedItemIds(new Set());
        setPoNote("");
        await loadOrders();
      } else {
        toast.error(res.message || "สร้าง PO ไม่สำเร็จ");
      }
    });
  };

  const handleStatusChange = async (poId: number, status: string) => {
    if (status === "CANCELLED" && !confirm("ต้องการยกเลิก PO นี้ใช่หรือไม่?")) return;
    startTransition(async () => {
      const res = await updatePurchaseOrderStatus(poId, status);
      if (res.success) {
        toast.success("เปลี่ยนสถานะ PO สำเร็จ");
        await loadOrders();
      } else {
        toast.error(res.message || "เปลี่ยนสถานะไม่สำเร็จ");
      }
    });
  };

  const handleDeletePO = async (poId: number, poNumber: string) => {
    if (!confirm(`ต้องการลบ ${poNumber} ใช่หรือไม่?`)) return;
    startTransition(async () => {
      const res = await deletePurchaseOrder(poId);
      if (res.success) {
        toast.success(`ลบ ${poNumber} สำเร็จ`);
        await loadOrders();
      } else {
        toast.error(res.message || "ลบ PO ไม่สำเร็จ");
      }
    });
  };

  return (
    <div className="space-y-4 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            {/* <FileText size={20} /> ใบสั่งซื้อ Purchase Orders */}
            <FileText size={20} /> ใบสั่งซื้อ (In Development)
          </h3>
          <p className="text-xs text-default-400">
            สร้างและจัดการใบสั่งซื้อจาก Supplier
          </p>
        </div>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          startContent={<Plus size={14} />}
          onPress={() => setIsCreating(true)}
        >
          สร้าง PO
        </Button>
      </div>

      {/* Create PO Modal */}
      <Modal
        isOpen={isCreating}
        onOpenChange={(open) => {
          if (!open) setIsCreating(false);
        }}
        size="3xl"
        placement="center"
        classNames={{
          base: "max-h-[90vh] rounded-2xl",
        }}
      >
        <ModalContent>
          <ModalBody className="p-6 space-y-4">
            <h3 className="text-lg font-bold">สร้างใบสั่งซื้อใหม่</h3>

            {/* Select Supplier */}
            <div>
              <label className="text-xs font-bold text-default-500 uppercase mb-1 block">
                Supplier
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => {
                  setSelectedSupplierId(e.target.value);
                  setSelectedItemIds(new Set());
                }}
                className="w-full px-3 py-2 text-sm bg-default-100 dark:bg-zinc-800 border border-default-300 rounded-xl"
              >
                <option value="">-- เลือก Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.supplierName}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Items */}
            {selectedSupplierId && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-default-500 uppercase">
                    รายการวัสดุ (เฉพาะที่เลือก Supplier นี้แล้ว)
                  </label>
                  <Button size="sm" variant="flat" onPress={selectAllEligible}>
                    {selectedItemIds.size === eligibleItems.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </Button>
                </div>
                {eligibleItems.length === 0 ? (
                  <p className="text-xs text-default-400 text-center py-4">
                    ไม่มีรายการที่เลือก Supplier นี้
                  </p>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto space-y-1 border border-default-200 rounded-xl p-2">
                    {eligibleItems.map((item) => {
                      const quote = item.quotes.find(
                        (q) => q.supplierId === Number(selectedSupplierId) && q.isSelected,
                      );
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-default-50 ${
                            selectedItemIds.has(item.id) ? "bg-primary-50/50" : ""
                          }`}
                          onClick={() => toggleItemSelection(item.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedItemIds.has(item.id)}
                            onChange={() => toggleItemSelection(item.id)}
                            className="rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.materialName}</p>
                            <p className="text-[10px] text-default-400">
                              {item.quantity ?? "-"} {item.unit || ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium">
                              {quote?.unitPrice != null ? `฿${Number(quote.unitPrice).toLocaleString()}` : "-"}
                            </p>
                            <p className="text-[10px] text-default-400">
                              รวม {quote?.totalPrice != null ? `฿${Number(quote.totalPrice).toLocaleString()}` : "-"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Note */}
            <div>
              <label className="text-xs font-bold text-default-500 uppercase mb-1 block">
                หมายเหตุ
              </label>
              <textarea
                value={poNote}
                onChange={(e) => setPoNote(e.target.value)}
                placeholder="หมายเหตุ PO (ไม่บังคับ)"
                className="w-full px-3 py-2 text-sm bg-default-100 dark:bg-zinc-800 border border-default-300 rounded-xl resize-none"
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="flat" onPress={() => setIsCreating(false)}>
                ยกเลิก
              </Button>
              <Button
                color="primary"
                startContent={<FileText size={16} />}
                onPress={handleCreatePO}
                isLoading={isPending}
                isDisabled={selectedItemIds.size === 0}
              >
                สร้าง PO ({selectedItemIds.size} รายการ)
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* PO List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner color="primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8 text-default-400 bg-default-50 rounded-xl border border-dashed">
          <FileText size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">ยังไม่มีใบสั่งซื้อ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((po) => {
            const statusInfo = PO_STATUS_MAP[po.status] || PO_STATUS_MAP.DRAFT;
            return (
              <div
                key={po.id}
                className="bg-white dark:bg-zinc-800/50 rounded-xl border border-default-200 p-4 space-y-3"
              >
                {/* PO Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-bold text-sm">{po.poNumber}</p>
                      <p className="text-[10px] text-default-400">
                        {po.supplier?.supplierName} · สร้างโดย {po.creator?.displayName || "-"} ·{" "}
                        {new Date(po.createdAt).toLocaleDateString("th-TH", {
                          day: "2-digit",
                          month: "short",
                          year: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip size="sm" color={statusInfo.color} variant="flat">
                      {statusInfo.label}
                    </Chip>
                    {po.totalAmount && (
                      <span className="text-sm font-bold text-primary">
                        ฿{Number(po.totalAmount).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* PO Items */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-default-400 border-b border-default-100">
                        <th className="text-left py-1 px-2">วัสดุ</th>
                        <th className="text-right py-1 px-2">ราคา/หน่วย</th>
                        <th className="text-right py-1 px-2">ราคารวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {po.items.map((item: any) => (
                        <tr key={item.id} className="border-b border-default-50">
                          <td className="py-1.5 px-2">
                            {item.procurementItem?.materialName || "-"}
                            <span className="text-default-400 ml-1">
                              {item.procurementItem?.quantity ?? ""} {item.procurementItem?.unit || ""}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-right">
                            {item.unitPrice != null ? `฿${Number(item.unitPrice).toLocaleString()}` : "-"}
                          </td>
                          <td className="py-1.5 px-2 text-right font-medium">
                            {item.totalPrice != null ? `฿${Number(item.totalPrice).toLocaleString()}` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {po.note && (
                  <p className="text-[10px] text-default-400">
                    หมายเหตุ: {po.note}
                  </p>
                )}

                {/* Status Actions */}
                <div className="flex gap-1 flex-wrap">
                  {po.status === "DRAFT" && (
                    <>
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        startContent={<Check size={12} />}
                        onPress={() => handleStatusChange(po.id, "APPROVED")}
                        isLoading={isPending}
                      >
                        อนุมัติ
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        startContent={<XCircle size={12} />}
                        onPress={() => handleStatusChange(po.id, "CANCELLED")}
                        isLoading={isPending}
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        startContent={<Trash2 size={12} />}
                        onPress={() => handleDeletePO(po.id, po.poNumber)}
                        isLoading={isPending}
                      >
                        ลบ
                      </Button>
                    </>
                  )}
                  {po.status === "APPROVED" && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="secondary"
                      startContent={<Send size={12} />}
                      onPress={() => handleStatusChange(po.id, "SENT")}
                      isLoading={isPending}
                    >
                      ส่งแล้ว
                    </Button>
                  )}
                  {po.status === "SENT" && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="success"
                      startContent={<Package size={12} />}
                      onPress={() => handleStatusChange(po.id, "RECEIVED")}
                      isLoading={isPending}
                    >
                      รับของแล้ว
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderPanel;
