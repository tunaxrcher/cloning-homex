"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Progress,
} from "@heroui/react";
import { ClipboardList, Sparkles, Check, Loader2, ImagePlus, X, FileText } from "lucide-react";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import type { CreateTaskV2ModalProps } from "@/lib/type";
import { createTaskV2, saveTaskV2AiData, createV2ChecklistAsSubtasks } from "@/lib/actions/actionTaskV2";
import { uploadImageFormData } from "@/lib/actions/actionIndex";
import { generateTaskV2Analysis } from "@/lib/ai/taskV2AI";
import { generationImage } from "@/lib/ai/geminiAI";
import { getOrgSetting } from "@/lib/actions/actionOrgSetting";
import { SETTING_KEYS } from "@/lib/settingKeys";

const AI_STEPS = [
  { label: "สร้างรูปภาพปกงาน" },
  { label: "บันทึกข้อมูลงานลงระบบ" },
  { label: "AI วิเคราะห์งบประมาณ ระยะเวลา & ความเสี่ยง" },
  { label: "บันทึกผลวิเคราะห์ AI" },
  { label: "สร้าง Checklist ขั้นตอนการทำงาน" },
];

const CreateTaskV2Modal = ({
  isOpen,
  onOpenChange,
  projectId,
  organizationId,
  currentUserId,
  projectCode,
}: CreateTaskV2ModalProps) => {
  const router = useRouter();
  const [taskName, setTaskName] = useState("");
  const [aiImages, setAiImages] = useState<File[]>([]);
  const [aiImagePreviews, setAiImagePreviews] = useState<string[]>([]);
  const [aiDescription, setAiDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPending, startTransition] = useTransition();
  const [taskPlaceholder, setTaskPlaceholder] = useState("เช่น งานติดตั้ง, งานซ่อมแซม, งานตรวจสอบ");

  useEffect(() => {
    getOrgSetting(SETTING_KEYS.TASK_PLACEHOLDER).then((val) => {
      if (val) setTaskPlaceholder(val);
    });
  }, []);

  const handleAiImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (f) =>
        ["image/jpeg", "image/png", "image/webp"].includes(f.type) &&
        f.size <= 10 * 1024 * 1024,
    );
    if (validFiles.length !== files.length) {
      toast.warning("บางไฟล์ไม่ถูกต้อง (รองรับ JPG, PNG, WebP ขนาดไม่เกิน 10MB)");
    }
    setAiImages((prev) => [...prev, ...validFiles]);
    setAiImagePreviews((prev) => [
      ...prev,
      ...validFiles.map((f) => URL.createObjectURL(f)),
    ]);
    e.target.value = "";
  };

  const removeAiImage = (index: number) => {
    URL.revokeObjectURL(aiImagePreviews[index]);
    setAiImages((prev) => prev.filter((_, i) => i !== index));
    setAiImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const aiProgress = currentStepIndex < 0 ? 0 : Math.min(Math.round(((currentStepIndex + 1) / AI_STEPS.length) * 100), 100);

  const handleCreate = async () => {
    if (!taskName.trim()) {
      toast.warning("กรุณากรอกชื่องาน");
      return;
    }

    setIsCreating(true);
    setCurrentStepIndex(0);

    try {
      // Prepare image payloads for AI (convert File[] → base64)
      let imagePayloads: { base64: string; mimeType: string }[] | undefined;
      if (aiImages.length > 0) {
        imagePayloads = await Promise.all(
          aiImages.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString("base64");
            return { base64, mimeType: file.type };
          }),
        );
      }

      // Step 0: Generate cover image + upload ref images to S3
      let coverUrl = "";
      let uploadedImageUrls: string[] = [];
      try {
        const imgRes = await generationImage(taskName);
        coverUrl = imgRes?.answer || "";
      } catch {
        // Image generation failed — continue without cover image
      }

      // Upload reference images to S3 (parallel)
      if (aiImages.length > 0) {
        const uploadResults = await Promise.all(
          aiImages.map(async (file) => {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("path", `task-ref-images/${projectId}`);
            return uploadImageFormData(fd);
          }),
        );
        uploadedImageUrls = uploadResults
          .filter((r) => r.success && r.url)
          .map((r) => r.url!);
      }

      // Step 1: Create task in DB (with ref data)
      setCurrentStepIndex(1);
      const taskRes = await createTaskV2(
        taskName,
        projectId,
        organizationId,
        coverUrl,
        aiDescription || undefined,
        uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
      );

      if (!taskRes.success || !taskRes.taskId) {
        throw new Error(taskRes.message || "สร้างงานไม่สำเร็จ");
      }

      // Step 2: AI Analysis (budget, duration & risk) — pass images + description
      setCurrentStepIndex(2);
      const customRolePrompt = await getOrgSetting(SETTING_KEYS.AI_TASK_ROLE_PROMPT);
      const aiData = await generateTaskV2Analysis(
        taskName,
        imagePayloads,
        aiDescription || undefined,
        customRolePrompt || undefined,
      );

      if (aiData) {
        // Step 3: Save AI data
        setCurrentStepIndex(3);
        await saveTaskV2AiData(taskRes.taskId, aiData);

        // Step 4: Create checklist as subtasks
        if (aiData.checklist && aiData.checklist.length > 0) {
          setCurrentStepIndex(4);
          await createV2ChecklistAsSubtasks(
            taskRes.taskId,
            projectId,
            organizationId,
            aiData.checklist
          );
        }
      } else {
        toast.warning("AI วิเคราะห์ไม่สำเร็จ — งานถูกสร้างแล้วแต่ยังไม่มีข้อมูล AI");
      }

      setCurrentStepIndex(AI_STEPS.length);
      toast.success("สร้างงานและวิเคราะห์ข้อมูล AI สำเร็จ!");

      startTransition(() => {
        router.refresh();
      });

      setTaskName("");
      setAiImages([]);
      setAiImagePreviews([]);
      setAiDescription("");
      setCurrentStepIndex(-1);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการสร้างงาน");
    } finally {
      setIsCreating(false);
      setCurrentStepIndex(-1);
    }
  };

  const handleClose = () => {
    if (isCreating) return;
    setTaskName("");
    setAiImages([]);
    aiImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setAiImagePreviews([]);
    setAiDescription("");
    setCurrentStepIndex(-1);
    onOpenChange(false);
  };

  const isBusy = isCreating || isPending;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
        else onOpenChange(true);
      }}
      placement="center"
      backdrop="blur"
      isDismissable={false}
      hideCloseButton={isBusy}
      classNames={{
        wrapper: "z-[9999]",
        base: "mx-4 w-full max-w-lg rounded-2xl bg-white dark:bg-[#18181b] shadow-2xl",
        header: "border-b border-default-100 p-4 sm:p-6",
        body: "p-4 sm:p-6 gap-4",
        footer: "border-t border-default-100 p-4 sm:p-6",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col items-center gap-4 pb-4">
              <div className="flex justify-center">
                <Image
                  src="/logo.png"
                  alt="HomeX"
                  width={120}
                  height={40}
                  className="object-contain"
                />
              </div>
              <h2 className="text-lg sm:text-xl font-bold gradientText text-center">
                {isCreating ? "AI กำลังวิเคราะห์งาน" : "สร้าง Task"}
              </h2>
              <p className="text-default-400 text-xs font-normal text-center">
                {isCreating ? "กรุณาอย่าปิดหน้าต่างนี้" : `ใส่ชื่องาน → AI วิเคราะห์ข้อมูลให้อัตโนมัติ (CODE: ${projectCode})`}
              </p>
            </ModalHeader>

            <ModalBody>
              {!isCreating ? (
                <>
                  <Input
                    isRequired
                    label="ชื่องาน"
                    placeholder={taskPlaceholder}
                    labelPlacement="outside"
                    variant="bordered"
                    value={taskName}
                    onValueChange={setTaskName}
                    isDisabled={isBusy}
                    startContent={
                      <ClipboardList className="text-default-400" size={18} />
                    }
                    classNames={{
                      input: "text-sm",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isBusy) handleCreate();
                    }}
                  />

           <hr className="h-px border-0 bg-gradient-to-r from-transparent via-gray-400/40 to-transparent" />

                  {/* รูปภาพประกอบสำหรับ AI (optional) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-default-600">
                      <ImagePlus className="text-default-400" size={16} />
                      แนบรูปภาพประกอบ
                      <span className="text-xs text-default-400 font-normal">(ไม่บังคับ)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {aiImagePreviews.map((src, idx) => (
                        <div
                          key={idx}
                          className="relative group w-16 h-16 rounded-lg overflow-hidden border border-default-200 dark:border-default-100"
                        >
                          <img
                            src={src}
                            alt={`ref ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeAiImage(idx)}
                            className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <label className="w-16 h-16 flex flex-col items-center justify-center gap-0.5 border-2 border-dashed border-default-300 dark:border-default-200 rounded-lg cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-colors">
                        <ImagePlus size={18} className="text-default-400" />
                        <span className="text-[9px] text-default-400">เพิ่มรูป</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          className="hidden"
                          onChange={handleAiImageChange}
                        />
                      </label>
                    </div>
                    {aiImages.length > 0 && (
                      <p className="text-[10px] text-default-400">
                        {aiImages.length} รูป (JPG, PNG, WebP ไม่เกิน 10MB/รูป)
                      </p>
                    )}
                  </div>

                  {/* คำอธิบายเพิ่มเติมสำหรับ AI (optional) */}
                  <Textarea
                    label="คำอธิบายเพิ่มเติม"
                    placeholder="ใส่คำอธิบายเพิ่มเติม เพื่อการวิเคราะห์ที่แม่นยำขึ้น..."
                    labelPlacement="outside"
                    variant="bordered"
                    minRows={2}
                    maxRows={4}
                    value={aiDescription}
                    onValueChange={setAiDescription}
                    isDisabled={isBusy}
                    description=""
                    startContent={
                      <FileText className="text-default-400 mt-0.5" size={16} />
                    }
                    classNames={{
                      input: "text-sm",
                    }}
                  />

                  <div className="p-3 bg-default-50 dark:bg-zinc-800/50 rounded-xl text-xs text-default-500 space-y-1">
                    <p className="font-semibold text-default-600">AI จะวิเคราะห์ให้อัตโนมัติ:</p>
                    <p>• ประเมินงบประมาณ (ค่าวัสดุ / ค่าแรง / ค่าเครื่องจักร)</p>
                    <p>• ระยะเวลาดำเนินงาน</p>
                    <p>• ความเสี่ยงและแนวทางป้องกัน</p>
                    <p>• Checklist ขั้นตอนการทำงาน</p>
                    <p>• รายการวัสดุสำหรับจัดซื้อ</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center space-y-5 py-4">
                  {/* Progress bar */}
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-default-400">กำลังดำเนินการ...</span>
                      <span className="font-bold text-primary">{aiProgress}%</span>
                    </div>
                    <Progress value={aiProgress} color="primary" size="sm" />
                  </div>

                  {/* Step list */}
                  <div className="w-full max-w-xs space-y-2">
                    {AI_STEPS.map((s, i) => {
                      const isDone = currentStepIndex > i;
                      const isActive = currentStepIndex === i;
                      if (currentStepIndex < i) return null;

                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 animate-in fade-in slide-in-from-left-2"
                          style={{ animationDuration: "300ms" }}
                        >
                          {isDone ? (
                            <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                              <Check size={12} className="text-success" />
                            </div>
                          ) : isActive ? (
                            <div className="w-5 h-5 flex items-center justify-center shrink-0">
                              <Loader2 size={14} className="text-primary animate-spin" />
                            </div>
                          ) : null}
                          <span
                            className={`text-xs ${
                              isDone
                                ? "text-success"
                                : isActive
                                ? "text-primary font-medium"
                                : "text-default-400"
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                      );
                    })}

                    {currentStepIndex >= AI_STEPS.length && (
                      <div
                        className="flex items-center gap-2.5 animate-in fade-in slide-in-from-left-2"
                        style={{ animationDuration: "300ms" }}
                      >
                        <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                          <Check size={12} className="text-success" />
                        </div>
                        <span className="text-xs font-medium text-success">
                          ดำเนินการเสร็จสิ้น!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </ModalBody>

            <ModalFooter className="flex flex-col-reverse sm:flex-row gap-3">
              {/* <Button
                variant="light"
                color="danger"
                radius="full"
                onPress={handleClose}
                isDisabled={isBusy}
              >
                ยกเลิก
              </Button> */}
              {!isCreating && (
                <Button
                  color="primary"
                  radius="full"
                  className="w-full h-12 sm:h-10 font-medium bg-black text-white dark:bg-white dark:text-black shadow-lg"
                  isLoading={isBusy}
                  onPress={handleCreate}
                >
                  สร้าง Task
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default CreateTaskV2Modal;
