"use client";

import { useState, useEffect, useTransition } from "react";
import { Progress, Input, Button, Textarea } from "@heroui/react";
import {
  DollarSign,
  CalendarDays,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  Pencil,
  Check,
  X,
  ImageIcon,
  FileText,
  ImagePlus,
} from "lucide-react";
import { toast } from "react-toastify";
import type { TaskV2AIResponse, TaskActualCostSummary } from "@/lib/type";
import { getActualCostSummary, updateTaskCustomBudget } from "@/lib/actions/actionTaskV2ActualCost";
import { uploadImageFormData } from "@/lib/actions/actionIndex";

interface TaskV2CardTabProps {
  aiData: TaskV2AIResponse;
  taskId: number;
  currentBudget: number;
  startActual: string | null;
  finishActual: string | null;
  onBudgetChange?: (newBudget: number) => void;
  aiRefDescription?: string | null;
  aiRefImages?: string[];
  onUpdateRef?: (data: { aiRefDescription?: string | null; aiRefImages?: string[] | null }) => Promise<void>;
  projectId?: number;
}

const TaskV2CardTab = ({
  aiData,
  taskId,
  currentBudget,
  startActual,
  finishActual,
  onBudgetChange,
  aiRefDescription,
  aiRefImages,
  onUpdateRef,
  projectId,
}: TaskV2CardTabProps) => {
  const { costEstimation, durationEstimate, risks } = aiData;

  // Ref edit state
  const [isEditingRef, setIsEditingRef] = useState(false);
  const [editDesc, setEditDesc] = useState(aiRefDescription || "");
  const [editImages, setEditImages] = useState<string[]>(aiRefImages || []);
  const [isSavingRef, setIsSavingRef] = useState(false);
  const [isUploadingImg, setIsUploadingImg] = useState(false);

  // Sync edit state when props change (e.g. after save or re-analyze)
  useEffect(() => {
    if (!isEditingRef) {
      setEditDesc(aiRefDescription || "");
      setEditImages(aiRefImages || []);
    }
  }, [aiRefDescription, aiRefImages, isEditingRef]);

  const handleRefImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const validFiles = files.filter(
      (f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size <= 10 * 1024 * 1024
    );
    if (validFiles.length === 0) {
      toast.warning("ไฟล์ไม่ถูกต้อง (รองรับ JPG, PNG, WebP ไม่เกิน 10MB)");
      return;
    }
    setIsUploadingImg(true);
    try {
      const results = await Promise.all(
        validFiles.map(async (file) => {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("path", `task-ref-images/${projectId || 0}`);
          return uploadImageFormData(fd);
        })
      );
      const newUrls = results.filter((r) => r.success && r.url).map((r) => r.url!);
      setEditImages((prev) => [...prev, ...newUrls]);
    } catch {
      toast.error("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setIsUploadingImg(false);
      e.target.value = "";
    }
  };

  const handleSaveRef = async () => {
    if (!onUpdateRef) return;
    setIsSavingRef(true);
    try {
      await onUpdateRef({
        aiRefDescription: editDesc.trim() || null,
        aiRefImages: editImages.length > 0 ? editImages : null,
      });
      setIsEditingRef(false);
    } catch {
      toast.error("บันทึกไม่สำเร็จ");
    } finally {
      setIsSavingRef(false);
    }
  };

  const [actualSummary, setActualSummary] = useState<TaskActualCostSummary>({
    material: 0,
    labor: 0,
    machinery: 0,
    total: 0,
  });
  const [budget, setBudget] = useState(currentBudget);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(
    currentBudget ? currentBudget.toLocaleString("th-TH") : ""
  );
  const [isPending, startTransition] = useTransition();

  const formatBudgetNumber = (val: string) => {
    const num = val.replace(/[^0-9.]/g, "");
    if (!num) return "";
    const parts = num.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
  };

  const parseBudgetNumber = (val: string) => Number(val.replace(/,/g, ""));

  const handleBudgetInputChange = (val: string) => {
    const raw = val.replace(/,/g, "");
    if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
      setBudgetInput(formatBudgetNumber(raw));
    }
  };

  useEffect(() => {
    getActualCostSummary(taskId).then((res) => {
      if (res.success) setActualSummary(res.data);
    });
  }, [taskId]);

  const handleSaveBudget = () => {
    const val = parseBudgetNumber(budgetInput);
    if (isNaN(val) || val < 0) {
      toast.error("กรุณากรอกตัวเลขที่ถูกต้อง");
      return;
    }
    startTransition(async () => {
      const res = await updateTaskCustomBudget(taskId, val);
      if (res.success) {
        setBudget(val);
        setIsEditingBudget(false);
        onBudgetChange?.(val);
        toast.success("บันทึกราคากลางสุทธิสำเร็จ");
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    });
  };

  const actualDays = (() => {
    if (!startActual) return 0;
    const start = new Date(startActual);
    const end = finishActual ? new Date(finishActual) : new Date();
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  })();

  const actualTotal = actualSummary.total;
  const actualMaterialPercent = actualTotal > 0 ? Math.round((actualSummary.material / actualTotal) * 100) : 0;
  const actualLaborPercent = actualTotal > 0 ? Math.round((actualSummary.labor / actualTotal) * 100) : 0;
  const actualMachineryPercent = actualTotal > 0 ? Math.round((actualSummary.machinery / actualTotal) * 100) : 0;

  return (
    <div className="space-y-6">


      {/* ===== ACTUAL COST (ข้อมูลจริง) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="bg-zinc-900/60 border border-emerald-800/40 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <TrendingUp size={18} />
            <h3 className="font-bold text-sm">
              งบประมาณจริง (Actual Cost)
            </h3>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {isEditingBudget ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={budgetInput}
                    onValueChange={handleBudgetInputChange}
                    size="sm"
                    variant="bordered"
                    startContent={<span className="text-zinc-400 text-sm">฿</span>}
                    classNames={{
                      input: "text-lg font-bold text-white",
                      inputWrapper: "bg-zinc-900/80 border-zinc-600 h-10",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveBudget();
                      if (e.key === "Escape") {
                        setIsEditingBudget(false);
                        setBudgetInput(budget ? budget.toLocaleString("th-TH") : "");
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    isIconOnly
                    size="sm"
                    color="success"
                    variant="flat"
                    onPress={handleSaveBudget}
                    isLoading={isPending}
                  >
                    <Check size={14} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    color="danger"
                    variant="flat"
                    onPress={() => {
                      setIsEditingBudget(false);
                      setBudgetInput(budget ? budget.toLocaleString("th-TH") : "");
                    }}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-400">
                    ฿ {budget.toLocaleString("th-TH")}
                  </p>
                  <button
                    onClick={() => {
                      setBudgetInput(budget ? budget.toLocaleString("th-TH") : "");
                      setIsEditingBudget(true);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-zinc-700/60 text-zinc-500 hover:text-zinc-300 transition-colors text-[11px] pt-1"
                  >
                    <Pencil size={11} />
                    <span>ตั้งค่า</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {/* Material */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  ค่าวัสดุ ({actualMaterialPercent}%)
                </span>
                <span className="font-medium">
                  ฿ {actualSummary.material.toLocaleString("th-TH")}
                </span>
              </div>
              <Progress
                value={actualMaterialPercent}
                color="primary"
                size="sm"
                className="w-full"
              />
            </div>

            {/* Labor */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  ค่าแรงติดตั้ง ({actualLaborPercent}%)
                </span>
                <span className="font-medium">
                  ฿ {actualSummary.labor.toLocaleString("th-TH")}
                </span>
              </div>
              <Progress
                value={actualLaborPercent}
                color="warning"
                size="sm"
                className="w-full"
              />
            </div>

            {/* Machinery */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  ค่าเครื่องจักร ({actualMachineryPercent}%)
                </span>
                <span className="font-medium">
                  ฿ {actualSummary.machinery.toLocaleString("th-TH")}
                </span>
              </div>
              <Progress
                value={actualMachineryPercent}
                color="secondary"
                size="sm"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1 border-t border-zinc-800/60">
            <p className="text-xs text-zinc-400">
              ยอดรวมจริง: <span className="font-semibold text-emerald-400">฿ {actualTotal.toLocaleString("th-TH")}</span>
            </p>
          </div>
        </div>

        {/* Actual Duration */}
        <div className="bg-zinc-900/60 border border-emerald-800/40 rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center text-center space-y-3">
          <CalendarDays className="text-emerald-400" size={32} />
          <p className="text-xs text-zinc-400 font-medium">
            ระยะเวลาจริง (Actual Duration)
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-emerald-400">
              {startActual ? actualDays : "—"}
            </span>
            <span className="text-zinc-400 text-sm">วัน</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 rounded-full text-xs text-zinc-400">
            {startActual
              ? finishActual
                ? "เสร็จสิ้นแล้ว"
                : "กำลังดำเนินการ"
              : "ยังไม่เริ่มงาน"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-zinc-700/60" />
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">AI Estimation</span>
        <div className="flex-1 h-px bg-zinc-700/60" />
      </div>

      {/* ===== REFERENCE DATA (ข้อมูลอ้างอิงตอนสร้าง) ===== */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-300">
            <FileText size={18} className="text-secondary" />
            <h3 className="font-bold text-sm">ข้อมูลอ้างอิง (Reference Data)</h3>
          </div>
          {onUpdateRef && !isEditingRef && (
            <button
              onClick={() => {
                setEditDesc(aiRefDescription || "");
                setEditImages(aiRefImages || []);
                setIsEditingRef(true);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-zinc-700/60 text-zinc-500 hover:text-zinc-300 transition-colors text-[11px]"
            >
              <Pencil size={11} />
              <span>แก้ไข</span>
            </button>
          )}
        </div>

        {isEditingRef ? (
          <div className="space-y-3">
            <Textarea
              label="คำอธิบายเพิ่มเติม"
              placeholder="เช่น พื้นที่ 200 ตร.ม., บ้าน 2 ชั้น..."
              labelPlacement="outside"
              variant="bordered"
              minRows={2}
              maxRows={4}
              value={editDesc}
              onValueChange={setEditDesc}
              classNames={{ input: "text-sm" }}
            />

            <div className="space-y-2">
              <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                <ImageIcon size={13} /> รูปภาพประกอบ
              </p>
              <div className="flex flex-wrap gap-2">
                {editImages.map((url, idx) => (
                  <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-zinc-700">
                    <img src={url} alt={`ref ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <label className="w-16 h-16 flex flex-col items-center justify-center gap-0.5 border-2 border-dashed border-zinc-600 rounded-lg cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-colors">
                  {isUploadingImg ? (
                    <span className="text-[9px] text-zinc-400">อัปโหลด...</span>
                  ) : (
                    <>
                      <ImagePlus size={16} className="text-zinc-400" />
                      <span className="text-[9px] text-zinc-400">เพิ่มรูป</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleRefImageUpload}
                    disabled={isUploadingImg}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" color="success" variant="flat" onPress={handleSaveRef} isLoading={isSavingRef} startContent={!isSavingRef ? <Check size={14} /> : undefined}>
                บันทึก
              </Button>
              <Button size="sm" variant="flat" onPress={() => setIsEditingRef(false)} isDisabled={isSavingRef}>
                ยกเลิก
              </Button>
            </div>
          </div>
        ) : (
          <>
            {aiRefDescription ? (
              <div className="text-sm text-zinc-400 bg-zinc-800/50 rounded-lg p-3 leading-relaxed">
                {aiRefDescription}
              </div>
            ) : (
              <p className="text-xs text-zinc-600">ไม่มีคำอธิบายเพิ่มเติม</p>
            )}

            {aiRefImages && aiRefImages.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <ImageIcon size={13} />
                  รูปภาพประกอบ ({aiRefImages.length} รูป)
                </p>
                <div className="flex flex-wrap gap-2">
                  {aiRefImages.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-20 h-20 rounded-lg overflow-hidden border border-zinc-700 hover:border-primary transition-colors"
                    >
                      <img
                        src={url}
                        alt={`ref ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-600">ไม่มีรูปภาพประกอบ</p>
            )}
          </>
        )}
      </div>

      {/* ===== AI COST ESTIMATION ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <DollarSign size={18} />
            <h3 className="font-bold text-sm">
              ประเมินงบประมาณ (AI Cost Estimation)
            </h3>
          </div>

          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-bold">
              ฿{" "}
              {costEstimation.totalEstimate.toLocaleString("th-TH")}
            </p>
            <p className="text-xs text-zinc-500">/ ราคากลางสุทธิ</p>
          </div>

          <div className="space-y-3">
            {/* Material */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  ค่าวัสดุ ({costEstimation.breakdown.materialPercent}%)
                </span>
                <span className="font-medium">
                  ฿{" "}
                  {costEstimation.breakdown.materialCost.toLocaleString("th-TH")}
                </span>
              </div>
              <Progress
                value={costEstimation.breakdown.materialPercent}
                color="primary"
                size="sm"
                className="w-full"
              />
            </div>

            {/* Labor */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  ค่าแรงติดตั้ง ({costEstimation.breakdown.laborPercent}%)
                </span>
                <span className="font-medium">
                  ฿{" "}
                  {costEstimation.breakdown.laborCost.toLocaleString("th-TH")}
                </span>
              </div>
              <Progress
                value={costEstimation.breakdown.laborPercent}
                color="warning"
                size="sm"
                className="w-full"
              />
            </div>

            {/* Machinery */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  ค่าเครื่องจักร ({costEstimation.breakdown.machineryPercent}%)
                </span>
                <span className="font-medium">
                  ฿{" "}
                  {costEstimation.breakdown.machineryCost.toLocaleString("th-TH")}
                </span>
              </div>
              <Progress
                value={costEstimation.breakdown.machineryPercent}
                color="secondary"
                size="sm"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Duration Estimate */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center text-center space-y-3">
          <CalendarDays className="text-primary" size={32} />
          <p className="text-xs text-zinc-400 font-medium">
            ระยะเวลาดำเนินงาน (AI Estimate)
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">
              {durationEstimate.totalDays}
            </span>
            <span className="text-zinc-400 text-sm">วัน</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 rounded-full text-xs text-zinc-400">
            สมมติฐาน: {durationEstimate.assumptions}
          </div>
        </div>
      </div>

      {/* ===== AI RISK MANAGEMENT FLAGS ===== */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-warning">
          <AlertTriangle size={18} />
          <h3 className="font-bold text-sm">
            AI Risk Management Flags (แจ้งเตือนความเสี่ยง)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {risks.map((risk, i) => (
            <div
              key={i}
              className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-start gap-2">
                {risk.status === "mitigated" ? (
                  <ShieldCheck
                    className="text-success shrink-0 mt-0.5"
                    size={16}
                  />
                ) : (
                  <ShieldAlert
                    className="text-danger shrink-0 mt-0.5"
                    size={16}
                  />
                )}
                <h4 className="font-bold text-sm leading-tight">
                  {risk.name}
                </h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {risk.description}
              </p>
              <div className="flex items-start gap-1.5 text-xs text-success">
                <span>✓</span>
                <span>ป้องกัน: {risk.mitigation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskV2CardTab;
