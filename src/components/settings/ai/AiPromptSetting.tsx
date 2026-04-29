"use client";

import { useState, useTransition } from "react";
import { Button, Textarea, Card, CardBody, CardHeader, Chip, Accordion, AccordionItem } from "@heroui/react";
import { Bot, Sparkles, RotateCcw, Save, Eye } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

import { upsertOrgSetting } from "@/lib/actions/actionOrgSetting";
import { SETTING_KEYS } from "@/lib/settingKeys";
import { generateTaskPlaceholder } from "@/lib/ai/geminiAI";

const DEFAULT_ROLE_PROMPT = `คุณคือ AI ผู้เชี่ยวชาญระดับสูงด้านการบริหารโครงการ (Project Manager) การประเมินต้นทุน และการวางแผนงาน`;

const FIXED_TASK_INSTRUCTION = `Task: กรุณาวิเคราะห์รายการงานที่ได้รับ (ชื่องาน, รูปภาพประกอบ, คำอธิบายเพิ่มเติม) และสร้างข้อมูลประกอบการบริหารโครงการ 4 มิติ อย่างละเอียดเพื่อนำไปใช้ในระบบแอปพลิเคชันบริหารโครงการ

หมายเหตุ:
- ถ้ามีรูปภาพแนบมา ให้วิเคราะห์รูปภาพประกอบด้วย เพื่อประเมินขนาด ปริมาณ และรายละเอียดของงานให้แม่นยำมากขึ้น
- ถ้ามีคำอธิบายเพิ่มเติม ให้นำมาพิจารณาร่วมกับชื่องานและรูปภาพ`;

const FIXED_JSON_SCHEMA = `Requirement: กรุณาตอบกลับเป็น JSON Object ที่มีโครงสร้างดังนี้อย่างเคร่งครัด:

{
  "costEstimation": {
    "totalEstimate": (number - ต้นทุนรวมสุทธิโดยประมาณ หน่วยบาท),
    "breakdown": {
      "materialPercent": (number - สัดส่วนค่าวัสดุ/อุปกรณ์ %),
      "materialCost": (number - ค่าวัสดุ/อุปกรณ์ บาท),
      "laborPercent": (number - สัดส่วนค่าแรง %),
      "laborCost": (number - ค่าแรง บาท),
      "machineryPercent": (number - สัดส่วนค่าเครื่องมือ/อุปกรณ์เฉพาะทาง %),
      "machineryCost": (number - ค่าเครื่องมือ/อุปกรณ์เฉพาะทาง บาท)
    }
  },
  "durationEstimate": {
    "totalDays": (number - จำนวนวันทำงานรวม),
    "assumptions": (string - สมมติฐาน เช่น "ทีมงาน 3-5 คน")
  },
  "risks": [
    {
      "name": (string - ชื่อความเสี่ยง),
      "description": (string - คำอธิบาย/เงื่อนไขที่ทำให้เกิด),
      "mitigation": (string - แนวทางป้องกัน),
      "status": "risk"
    }
  ],
  "checklist": [
    {
      "name": (string - ชื่อขั้นตอนการทำงาน),
      "progressPercent": (number - % ความคืบหน้าสะสมเมื่อเสร็จขั้นตอนนี้),
      "checked": false
    }
  ],
  "materials": [
    {
      "spec": (string - ชื่อ/สเปควัสดุหรืออุปกรณ์),
      "quantity": (string - ปริมาณ เช่น "50 ชิ้น"),
      "unitPrice": (number - ราคาต่อหน่วย บาท),
      "unit": (string - หน่วย เช่น "ชิ้น", "ชุด", "เมตร"),
      "totalPrice": (number - ราคารวม บาท)
    }
  ],
  "phase": (string - Phase ของงาน เช่น "Phase 1")
}`;

const FIXED_CONSTRAINTS = `เงื่อนไขสำคัญ:
- ประเมินปริมาณวัสดุ/อุปกรณ์โดยเผื่อความสูญเสียตามมาตรฐาน
- ราคาอ้างอิงจากราคาตลาดในประเทศไทย
- Checklist ต้องครอบคลุมตั้งแต่เตรียมงานจนส่งมอบ โดย progressPercent เรียงจากน้อยไปมาก
- ความเสี่ยง 2-3 ข้อ พร้อมวิธีป้องกันจริง
- ห้ามมีข้อความนำหรือคำลงท้าย ห้ามครอบด้วย Markdown format`;

interface AiPromptSettingProps {
  initialRolePrompt: string;
  initialPlaceholder: string;
}

export default function AiPromptSetting({
  initialRolePrompt,
  initialPlaceholder,
}: AiPromptSettingProps) {
  const router = useRouter();

  const [rolePrompt, setRolePrompt] = useState(
    initialRolePrompt || DEFAULT_ROLE_PROMPT,
  );
  const [placeholder, setPlaceholder] = useState(
    initialPlaceholder || "เช่น งานติดตั้ง, งานซ่อมแซม, งานตรวจสอบ",
  );

  const [isSaving, startSaving] = useTransition();
  const [isGenerating, startGenerating] = useTransition();

  /* ========================= */
  /* SAVE                      */
  /* ========================= */
  const handleSave = () => {
    startSaving(async () => {
      const [r1, r2] = await Promise.all([
        upsertOrgSetting(SETTING_KEYS.AI_TASK_ROLE_PROMPT, rolePrompt.trim()),
        upsertOrgSetting(SETTING_KEYS.TASK_PLACEHOLDER, placeholder.trim()),
      ]);
      if (r1.success && r2.success) {
        toast.success("บันทึกการตั้งค่า AI สำเร็จ");
        router.refresh();
      } else {
        toast.error(r1.message || r2.message || "บันทึกไม่สำเร็จ");
      }
    });
  };

  /* ========================= */
  /* AUTO GENERATE PLACEHOLDER */
  /* ========================= */
  const handleGenPlaceholder = () => {
    if (!rolePrompt.trim()) {
      toast.warning("กรุณาระบุ AI Role Prompt ก่อน");
      return;
    }
    startGenerating(async () => {
      const result = await generateTaskPlaceholder(rolePrompt.trim());
      if (result) {
        setPlaceholder(result);
        toast.success("สร้าง Placeholder สำเร็จ");
      } else {
        toast.error("ไม่สามารถสร้าง Placeholder ได้");
      }
    });
  };

  /* ========================= */
  /* RESET TO DEFAULT          */
  /* ========================= */
  const handleReset = () => {
    setRolePrompt(DEFAULT_ROLE_PROMPT);
    setPlaceholder("เช่น งานติดตั้ง, งานซ่อมแซม, งานตรวจสอบ");
  };

  return (
    <Card className="xl:col-span-2">
      <CardHeader className="flex items-center gap-3 px-6 pt-6">
        <div className="p-2 rounded-xl bg-violet-500/10">
          <Bot className="text-violet-500" size={20} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">AI Prompt Setting</h3>
          <p className="text-default-400 text-sm">
            ตั้งค่า Prompt สำหรับ AI วิเคราะห์งาน (Task)
          </p>
        </div>
        <Chip size="sm" variant="flat" color="secondary">
          AI
        </Chip>
      </CardHeader>

      <CardBody className="px-6 pb-6 space-y-6">
        {/* ROLE PROMPT */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            AI Role Prompt
            <span className="text-default-400 ml-1">(บทบาท/บริบทธุรกิจของ AI)</span>
          </label>
          <Textarea
            value={rolePrompt}
            onValueChange={setRolePrompt}
            variant="bordered"
            minRows={4}
            maxRows={10}
            placeholder="เช่น คุณคือ AI ผู้เชี่ยวชาญด้านการซ่อมรถยนต์..."
            description="AI จะใช้บทบาทนี้ในการวิเคราะห์ Task ทุกครั้งที่สร้าง เช่น ประเมินราคา ระยะเวลา วัสดุ ความเสี่ยง"
          />
        </div>

        {/* TASK PLACEHOLDER */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">
              Task Name Placeholder
              <span className="text-default-400 ml-1">(ตัวอย่างชื่องาน)</span>
            </label>
            <Button
              size="sm"
              variant="flat"
              color="secondary"
              startContent={<Sparkles size={14} />}
              onPress={handleGenPlaceholder}
              isLoading={isGenerating}
            >
              AI สร้างให้
            </Button>
          </div>
          <Textarea
            value={placeholder}
            onValueChange={setPlaceholder}
            variant="bordered"
            minRows={1}
            maxRows={3}
            placeholder="เช่น เปลี่ยนผ้าเบรก, ซ่อมเกียร์"
            description="แสดงเป็นตัวอย่างในช่องกรอกชื่อ Task ตอนสร้างงานใหม่"
          />
        </div>

        {/* FULL PROMPT PREVIEW */}
        <Accordion variant="bordered" className="px-0">
          <AccordionItem
            key="preview"
            aria-label="Preview Full Prompt"
            title={
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-violet-500" />
                <span className="text-sm font-medium">Preview Prompt ที่จะส่งให้ AI (Real-time)</span>
              </div>
            }
          >
            <div className="rounded-xl bg-default-50 border border-default-200 p-4 text-sm leading-relaxed font-mono whitespace-pre-wrap max-h-[500px] overflow-y-auto space-y-1">
              {/* ROLE PROMPT — editable part */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-green-700 dark:text-green-400">
                <div className="text-[10px] uppercase tracking-wider text-green-500/70 mb-1 font-sans font-semibold">
                  ✏️ ส่วนที่คุณแก้ไขได้
                </div>
                {rolePrompt || DEFAULT_ROLE_PROMPT}
              </div>

              {/* FIXED: Task instruction */}
              <div className="text-default-600 px-3 py-2">
                {FIXED_TASK_INSTRUCTION}
              </div>

              {/* FIXED: JSON Schema */}
              <div className="bg-default-100 rounded-lg px-3 py-2 text-default-500">
                <div className="text-[10px] uppercase tracking-wider text-default-400 mb-1 font-sans font-semibold">
                  🔒 JSON Schema (แก้ไขไม่ได้)
                </div>
                {FIXED_JSON_SCHEMA}
              </div>

              {/* FIXED: Constraints */}
              <div className="text-default-600 px-3 py-2">
                {FIXED_CONSTRAINTS}
              </div>
            </div>
          </AccordionItem>
        </Accordion>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="light"
            startContent={<RotateCcw size={16} />}
            onPress={handleReset}
          >
            รีเซ็ตเป็นค่าเริ่มต้น
          </Button>
          <Button
            color="primary"
            startContent={<Save size={16} />}
            onPress={handleSave}
            isLoading={isSaving}
          >
            บันทึก
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
