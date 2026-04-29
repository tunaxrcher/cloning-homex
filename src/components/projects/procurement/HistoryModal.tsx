"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Chip,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { History } from "lucide-react";
import { getProcurementHistory } from "@/lib/actions/actionProcurement";

interface HistoryEntry {
  id: number;
  procurementItemId: number;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  changedByUser: { id: number; displayName: string | null } | null;
}

const ACTION_LABELS: Record<string, { label: string; color: "default" | "primary" | "success" | "warning" | "danger" | "secondary" }> = {
  CREATED: { label: "สร้างรายการ", color: "success" },
  UPDATED: { label: "แก้ไข", color: "primary" },
  STATUS_CHANGED: { label: "เปลี่ยนสถานะ", color: "warning" },
  DELETED: { label: "ลบ", color: "danger" },
  QUOTE_ADDED: { label: "เพิ่มใบเสนอราคา", color: "secondary" },
  QUOTE_DELETED: { label: "ลบใบเสนอราคา", color: "danger" },
  QUOTE_SELECTED: { label: "เลือก Supplier", color: "success" },
  TASK_LINKED: { label: "ผูก Task", color: "primary" },
  TASK_UNLINKED: { label: "ยกเลิกผูก Task", color: "default" },
  PO_GENERATED: { label: "สร้างใบสั่งซื้อ", color: "primary" },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "รอจัดซื้อ",
  PURCHASING: "อยู่ระหว่างจัดซื้อ",
  DELIVERING: "อยู่ระหว่างนำส่ง",
  ARRIVED: "ของถึงแล้ว",
  LOW_STOCK: "ใกล้หมด",
  OUT_OF_STOCK: "ขาดสต๊อก",
};

function parseValue(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function formatChange(action: string, oldVal: string | null, newVal: string | null): string {
  if (action === "STATUS_CHANGED") {
    const o = parseValue(oldVal);
    const n = parseValue(newVal);
    const from = STATUS_LABELS[String(o?.status)] || String(o?.status || "?");
    const to = STATUS_LABELS[String(n?.status)] || String(n?.status || "?");
    return `${from} → ${to}`;
  }
  if (action === "CREATED") return "สร้างรายการใหม่";
  if (action === "PO_GENERATED") {
    const n = parseValue(newVal);
    return n?.poNumber ? `PO: ${n.poNumber}` : "สร้างใบสั่งซื้อ";
  }
  return "";
}

interface HistoryModalProps {
  itemId: number | null;
  materialName: string;
  onClose: () => void;
}

const HistoryModal = ({ itemId, materialName, onClose }: HistoryModalProps) => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (itemId === null) return;
    setIsLoading(true);
    getProcurementHistory(itemId)
      .then((data) => setEntries(data as HistoryEntry[]))
      .finally(() => setIsLoading(false));
  }, [itemId]);

  return (
    <Modal
      isOpen={itemId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="flex items-center gap-2 pb-2">
              <History size={18} />
              <span>ประวัติการเปลี่ยนแปลง</span>
            </ModalHeader>
            <ModalBody className="pt-0">
              {materialName && (
                <p className="text-xs text-default-400 mb-2">{materialName}</p>
              )}
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner size="md" />
                </div>
              ) : entries.length === 0 ? (
                <p className="text-xs text-default-400 text-center py-10">
                  ไม่มีประวัติการเปลี่ยนแปลง
                </p>
              ) : (
                <div className="space-y-0">
                  {entries.map((entry, idx) => {
                    const actionInfo = ACTION_LABELS[entry.action] || { label: entry.action, color: "default" as const };
                    const detail = formatChange(entry.action, entry.oldValue, entry.newValue);
                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 py-2.5 relative"
                      >
                        {/* Timeline line */}
                        {idx < entries.length - 1 && (
                          <div className="absolute left-[11px] top-[28px] bottom-0 w-px bg-default-200" />
                        )}
                        {/* Dot */}
                        <div className="w-[22px] h-[22px] rounded-full bg-default-100 flex items-center justify-center shrink-0 z-10">
                          <div className="w-2 h-2 rounded-full bg-default-400" />
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Chip size="sm" variant="flat" color={actionInfo.color} className="text-[10px]">
                              {actionInfo.label}
                            </Chip>
                            {detail && (
                              <span className="text-xs text-default-600">{detail}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-default-400">
                              {new Date(entry.changedAt).toLocaleString("th-TH", {
                                day: "2-digit",
                                month: "short",
                                year: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {entry.changedByUser && (
                              <span className="text-[10px] text-default-400">
                                โดย {entry.changedByUser.displayName || `User #${entry.changedByUser.id}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onModalClose}>
                ปิด
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default HistoryModal;
