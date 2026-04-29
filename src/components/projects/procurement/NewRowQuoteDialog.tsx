"use client";

import {
  Button,
  Chip,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { Plus, Trash2, Save, Check, Sparkles, Store } from "lucide-react";

interface TempQuoteData {
  id: number;
  supplierId: number;
  supplierName: string;
  unitPrice: string;
  totalPrice: string;
  quoteDate: string;
  validUntil: string;
  note: string;
  isSelected: boolean;
}

interface AiEstimate {
  min: number;
  mid: number;
  max: number;
}

interface NewRowQuoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  materialName: string;
  specification?: string;
  quantity?: string;
  unit?: string;
  quotes: TempQuoteData[];
  suppliers: { id: number; supplierName: string }[];
  // Quote form
  isAddingQuote: boolean;
  onSetIsAddingQuote: (v: boolean) => void;
  newQuoteForm: {
    supplierId: string;
    unitPrice: string;
    totalPrice: string;
    quoteDate: string;
    validUntil: string;
    note: string;
  };
  onUpdateQuoteForm: (updates: Partial<NewRowQuoteDialogProps["newQuoteForm"]>) => void;
  onAddQuote: () => void;
  onDeleteQuote: (id: number) => void;
  onSelectQuote: (id: number) => void;
  // AI estimate
  aiEstimate: AiEstimate | null;
  isEstimating: boolean;
  onAiEstimate: () => void;
  // Confirm
  onConfirm: () => void;
  formatDate: (d: string | Date | null | undefined) => string | null;
}

const NewRowQuoteDialog = ({
  isOpen,
  onClose,
  materialName,
  specification,
  quantity,
  unit,
  quotes,
  suppliers,
  isAddingQuote,
  onSetIsAddingQuote,
  newQuoteForm,
  onUpdateQuoteForm,
  onAddQuote,
  onDeleteQuote,
  onSelectQuote,
  aiEstimate,
  isEstimating,
  onAiEstimate,
  onConfirm,
  formatDate,
}: NewRowQuoteDialogProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="3xl"
      scrollBehavior="inside"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
    >
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 pb-2">
              <div className="flex items-center gap-2">
                <Store size={18} />
                <span>จัดการใบเสนอราคา</span>
                {quotes.length > 0 && (
                  <Chip size="sm" variant="flat" color="success" className="ml-2">
                    {quotes.length} รายการ
                  </Chip>
                )}
              </div>
              <p className="text-xs text-default-400 font-normal">
                {materialName}
                {specification ? ` | ${specification}` : ""}
                {quantity ? ` | ${quantity} ${unit || ""}` : ""}
              </p>
            </ModalHeader>
            <ModalBody className="pt-0 space-y-3">
              {/* AI Estimate */}
              <div className="flex items-center justify-end gap-2">
                <Tooltip content="AI ประเมินราคากลาง">
                  <Button
                    size="sm"
                    variant="flat"
                    color="secondary"
                    startContent={<Sparkles size={14} />}
                    onPress={onAiEstimate}
                    isLoading={isEstimating}
                  >
                    AI ราคากลาง
                  </Button>
                </Tooltip>
              </div>

              {aiEstimate && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-success-50 dark:bg-success-900/20 rounded-lg p-2 text-center">
                    <p className="text-[10px] uppercase text-success-600 font-bold">ประหยัด</p>
                    <p className="text-sm font-bold text-success-700">
                      ฿{aiEstimate.min.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-2 text-center">
                    <p className="text-[10px] uppercase text-primary-600 font-bold">กลาง</p>
                    <p className="text-sm font-bold text-primary-700">
                      ฿{aiEstimate.mid.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-2 text-center">
                    <p className="text-[10px] uppercase text-warning-600 font-bold">Premium</p>
                    <p className="text-sm font-bold text-warning-700">
                      ฿{aiEstimate.max.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Quote Table */}
              {quotes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-default-200 text-default-500">
                        <th className="text-left py-2 px-2 font-bold">Supplier</th>
                        <th className="text-right py-2 px-2 font-bold">ราคา/หน่วย</th>
                        <th className="text-right py-2 px-2 font-bold">ราคารวม</th>
                        <th className="text-center py-2 px-2 font-bold">วันเสนอราคา</th>
                        <th className="text-center py-2 px-2 font-bold">หมดอายุ</th>
                        <th className="text-left py-2 px-2 font-bold">โน้ต</th>
                        <th className="text-center py-2 px-2 font-bold">เลือก</th>
                        <th className="py-2 px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotes.map((q) => (
                        <tr
                          key={q.id}
                          className={`border-b border-default-100 hover:bg-default-100/50 ${
                            q.isSelected ? "bg-success-50/50 dark:bg-success-900/10" : ""
                          }`}
                        >
                          <td className="py-2 px-2 font-medium">{q.supplierName}</td>
                          <td className="py-2 px-2 text-right">
                            {q.unitPrice ? `฿${Number(q.unitPrice).toLocaleString()}` : "-"}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {q.totalPrice ? `฿${Number(q.totalPrice).toLocaleString()}` : "-"}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {q.quoteDate ? formatDate(q.quoteDate) : "-"}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {q.validUntil ? formatDate(q.validUntil) : "-"}
                          </td>
                          <td className="py-2 px-2 text-default-400 max-w-[120px] truncate">
                            {q.note || "-"}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {q.isSelected ? (
                              <Chip size="sm" color="success" variant="flat" className="text-[10px]">
                                เลือกแล้ว
                              </Chip>
                            ) : (
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="success"
                                onPress={() => onSelectQuote(q.id)}
                              >
                                <Check size={14} />
                              </Button>
                            )}
                          </td>
                          <td className="py-2 px-2">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => onDeleteQuote(q.id)}
                            >
                              <Trash2 size={12} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-default-400 text-center py-4">
                  ยังไม่มีใบเสนอราคา
                </p>
              )}

              {/* Add New Quote Form */}
              {isAddingQuote ? (
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-default-200 space-y-2">
                  <p className="text-xs font-bold text-default-500 uppercase">เพิ่มใบเสนอราคาใหม่</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <select
                      value={newQuoteForm.supplierId}
                      onChange={(e) => onUpdateQuoteForm({ supplierId: e.target.value })}
                      className="col-span-2 sm:col-span-1 px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                    >
                      <option value="">-- เลือก Supplier --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.supplierName}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="ราคา/หน่วย"
                      value={newQuoteForm.unitPrice}
                      onChange={(e) => onUpdateQuoteForm({ unitPrice: e.target.value })}
                      className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="ราคารวม"
                      value={newQuoteForm.totalPrice}
                      onChange={(e) => onUpdateQuoteForm({ totalPrice: e.target.value })}
                      className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                    />
                    <input
                      type="date"
                      value={newQuoteForm.quoteDate}
                      onChange={(e) => onUpdateQuoteForm({ quoteDate: e.target.value })}
                      className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                      title="วันเสนอราคา"
                    />
                    <input
                      type="date"
                      value={newQuoteForm.validUntil}
                      onChange={(e) => onUpdateQuoteForm({ validUntil: e.target.value })}
                      className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                      title="หมดอายุ"
                    />
                    <input
                      type="text"
                      placeholder="โน้ต"
                      value={newQuoteForm.note}
                      onChange={(e) => onUpdateQuoteForm({ note: e.target.value })}
                      className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => onSetIsAddingQuote(false)}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      size="sm"
                      color="success"
                      variant="flat"
                      startContent={<Save size={14} />}
                      onPress={onAddQuote}
                    >
                      เพิ่ม
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    startContent={<Plus size={14} />}
                    onPress={() => onSetIsAddingQuote(true)}
                  >
                    เพิ่ม Supplier
                  </Button>
                </div>
              )}
            </ModalBody>
            <ModalFooter className="justify-center">
              <Button variant="flat" onPress={onModalClose}>
                ยกเลิก
              </Button>
              <Button
                color="success"
                startContent={<Store size={14} />}
                onPress={() => {
                  onConfirm();
                  onModalClose();
                }}
              >
                ยืนยัน
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default NewRowQuoteDialog;
