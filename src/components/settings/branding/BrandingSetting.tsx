"use client";

import { useState, useTransition, useRef } from "react";
import { Button, Input, Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";
import { Palette, Save, RotateCcw, Upload, X, Check } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { upsertOrgSetting } from "@/lib/actions/actionOrgSetting";
import { uploadImageFormData } from "@/lib/actions/actionIndex";
import { SETTING_KEYS } from "@/lib/settingKeys";
import { COLOR_PRESETS, DEFAULT_COLOR_KEY } from "@/lib/themePresets";

const DEFAULTS = {
  orgName: "HOMEX",
  welcomeText: "Welcome to HomeX",
  tagline: "Smart Work",
  logoUrl: "/logo.png",
  primaryColor: DEFAULT_COLOR_KEY,
};

interface BrandingSettingProps {
  initialOrgName: string;
  initialLogoUrl: string;
  initialWelcomeText: string;
  initialTagline: string;
  initialPrimaryColor: string;
}

export default function BrandingSetting({
  initialOrgName,
  initialLogoUrl,
  initialWelcomeText,
  initialTagline,
  initialPrimaryColor,
}: BrandingSettingProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orgName, setOrgName] = useState(initialOrgName || DEFAULTS.orgName);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl || DEFAULTS.logoUrl);
  const [welcomeText, setWelcomeText] = useState(initialWelcomeText || DEFAULTS.welcomeText);
  const [tagline, setTagline] = useState(initialTagline || DEFAULTS.tagline);
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor || DEFAULTS.primaryColor);

  const [isSaving, startSaving] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  /* ========================= */
  /* UPLOAD LOGO               */
  /* ========================= */
  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type)) {
      toast.warning("รองรับเฉพาะ PNG, JPG, WebP, SVG");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning("ไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", "branding");
      const res = await uploadImageFormData(formData);
      if (res.success && res.url) {
        setLogoUrl(res.url);
        toast.success("อัปโหลดโลโก้สำเร็จ");
      } else {
        toast.error(res.error || "อัปโหลดไม่สำเร็จ");
        setLogoPreview(null);
      }
    } catch {
      toast.error("อัปโหลดไม่สำเร็จ");
      setLogoPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  /* ========================= */
  /* SAVE                      */
  /* ========================= */
  const handleSave = () => {
    startSaving(async () => {
      const results = await Promise.all([
        upsertOrgSetting(SETTING_KEYS.ORG_NAME, orgName.trim()),
        upsertOrgSetting(SETTING_KEYS.ORG_LOGO_URL, logoUrl.trim()),
        upsertOrgSetting(SETTING_KEYS.ORG_WELCOME_TEXT, welcomeText.trim()),
        upsertOrgSetting(SETTING_KEYS.ORG_TAGLINE, tagline.trim()),
        upsertOrgSetting(SETTING_KEYS.ORG_PRIMARY_COLOR, primaryColor),
      ]);
      if (results.every((r) => r.success)) {
        toast.success("บันทึก Branding สำเร็จ");
        router.refresh();
      } else {
        toast.error("บันทึกไม่สำเร็จ");
      }
    });
  };

  /* ========================= */
  /* RESET                     */
  /* ========================= */
  const handleReset = () => {
    setOrgName(DEFAULTS.orgName);
    setLogoUrl(DEFAULTS.logoUrl);
    setWelcomeText(DEFAULTS.welcomeText);
    setTagline(DEFAULTS.tagline);
    setPrimaryColor(DEFAULTS.primaryColor);
    setLogoPreview(null);
  };

  const displayLogo = logoPreview || logoUrl;

  return (
    <Card className="xl:col-span-2">
      <CardHeader className="flex items-center gap-3 px-6 pt-6">
        <div className="p-2 rounded-xl bg-blue-500/10">
          <Palette className="text-blue-500" size={20} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Branding</h3>
        </div>
        <Chip size="sm" variant="flat" color="primary">
          Brand
        </Chip>
      </CardHeader>

      <CardBody className="px-6 pb-6 space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          {/* LEFT: Logo */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-xl border-2 border-dashed border-default-300 flex items-center justify-center overflow-hidden bg-default-50">
                {displayLogo ? (
                  <Image
                    src={displayLogo}
                    alt="Logo"
                    width={80}
                    height={80}
                    className="object-contain rounded-lg"
                  />
                ) : (
                  <Upload className="text-default-300" size={24} />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  startContent={<Upload size={14} />}
                  onPress={() => fileInputRef.current?.click()}
                  isLoading={isUploading}
                >
                  อัปโหลดโลโก้
                </Button>
                {logoUrl !== DEFAULTS.logoUrl && (
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    startContent={<X size={14} />}
                    onPress={() => {
                      setLogoUrl(DEFAULTS.logoUrl);
                      setLogoPreview(null);
                    }}
                  >
                    ใช้โลโก้เริ่มต้น
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoSelect}
              />
            </div>
            <p className="text-xs text-default-400">PNG, JPG, WebP, SVG ไม่เกิน 5MB</p>
          </div>

          {/* RIGHT: Text fields */}
          <div className="flex flex-col gap-2">
            <Input
              label="ชื่อองค์กร"
              labelPlacement="outside"
              variant="bordered"
              value={orgName}
              onValueChange={setOrgName}
              placeholder="เช่น MyCompany"
              description="แสดงบน Sidebar และหน้า Login"
            />
            <Input
              label="ข้อความต้อนรับ"
              labelPlacement="outside"
              variant="bordered"
              value={welcomeText}
              onValueChange={setWelcomeText}
              placeholder="เช่น Welcome to MyApp"
              description="หัวข้อหลักหน้า Login"
            />
            <Input
              label="Tagline"
              labelPlacement="outside"
              variant="bordered"
              value={tagline}
              onValueChange={setTagline}
              placeholder="เช่น Smart Work"
              description="ข้อความรองใต้หัวข้อหน้า Login"
            />
          </div>
        </div>

        <Divider />

        {/* PRIMARY COLOR */}
        <div className="space-y-3">
          <label className="text-sm font-medium">
            สีหลัก (Primary Color)
            <span className="text-default-400 ml-1">ใช้กับปุ่ม, แท็บ, ลิงก์ทั้งระบบ</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => setPrimaryColor(preset.key)}
                className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                  primaryColor === preset.key
                    ? "border-foreground scale-110 shadow-lg"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: preset.hex }}
                title={preset.label}
              >
                {primaryColor === preset.key && (
                  <Check size={16} className="absolute inset-0 m-auto text-white" />
                )}
              </button>
            ))}
          </div>
        </div>

        <Divider />

        {/* PREVIEW */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Preview หน้า Login</label>
          <div className="rounded-xl border border-default-200 bg-default-50 p-6 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white flex items-center justify-center border border-default-200">
              {displayLogo && (
                <Image
                  src={displayLogo}
                  alt="Preview Logo"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              )}
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold">{welcomeText || "Welcome"}</h3>
              <p className="text-sm text-default-400 mt-1">{tagline || "Tagline"}</p>
            </div>
          </div>
        </div>

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
