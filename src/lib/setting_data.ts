import { Box, Home, Settings, Users } from "lucide-react";
import { ProjectMetricsBoard, Task } from "./type";

export const menuItems = [
  { name: "Dashboard", icon: Home, path: "/dashboard" },
  { name: "Projects", icon: Box, path: "/projects" },
  { name: "User", icon: Users, path: "/user", permissionKey: "PAGE_USER" },
  {
    name: "Settings",
    icon: Settings,
    path: "/settings",
    permissionKey: "PAGE_SETTING",
  },
];

export const linkUserTemp = [{ name: "Profile", path: "/profile_temp.png" }];

export const getStatusProjectColor = (status: string) => {
  switch ((status ?? "").toUpperCase()) {
    case "DONE":
      return "success";
    case "IN_PROGRESS":
      return "primary";
    case "ON_HOLD":
      return "danger";
    case "PLANNING":
      return "warning";
    default:
      return "default";
  }
};

export const fmtDate = (d?: any) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const diffDaysInclusive = (from?: any, to?: any) => {
  if (!from || !to) return null;
  const a = new Date(from);
  const b = new Date(to);
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  const ms = b0.getTime() - a0.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  return days + 1; // ✅ รวมวันเริ่มด้วย
};

export const dayStart = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const daysDiff = (from: Date, to: Date) => {
  const ms = dayStart(to).getTime() - dayStart(from).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

export const getDueInfo = (
  finishPlanned?: any,
  status?: string,
  progress?: number,
) => {
  // Completed condition
  if (status === "DONE" || (progress ?? 0) >= 100) {
    return { label: "Completed", tone: "success" as const };
  }

  if (!finishPlanned) {
    return { label: "No deadline", tone: "default" as const };
  }

  const today = new Date();
  const finish = new Date(finishPlanned);
  if (Number.isNaN(finish.getTime())) {
    return { label: "Invalid deadline", tone: "default" as const };
  }

  const diff = daysDiff(today, finish);

  if (diff > 0)
    return { label: `Due in ${diff} days`, tone: "primary" as const };
  if (diff === 0) return { label: "Due today", tone: "warning" as const };
  return { label: `Overdue ${Math.abs(diff)} days`, tone: "danger" as const };
};

export const fmtMoney = (v?: any) => {
  if (v == null || v === "" || v === "-") return "-";
  const n = typeof v === "string" ? Number(v) : Number(v);
  if (Number.isNaN(n)) return String(v);
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(n);
};

export const calcProgress = (t: Task) => {
  if (!t.details || t.details.length === 0) return t.progressPercent || 0;
  const done = t.details.filter((s) => s.status === true).length;
  return Math.round((done / t.details.length) * 100);
};

export const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "-";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("th-TH");
};

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function calcDurationDays(
  start?: string | Date | null,
  finish?: string | Date | null,
) {
  if (!start || !finish) return null;

  const s = new Date(start);
  const f = new Date(finish);

  const s0 = new Date(s.getFullYear(), s.getMonth(), s.getDate());
  const f0 = new Date(f.getFullYear(), f.getMonth(), f.getDate());

  const diffMs = f0.getTime() - s0.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) return null;

  // return days + 1;
  return days;
}

export const getMediaType = (
  url: string | undefined | null,
): "video" | "image" | "unknown" => {
  if (!url) return "unknown";

  const cleanUrl = url.split("?")[0].toLowerCase();

  if (cleanUrl.match(/\.(mp4|webm|ogg|mov)$/i)) {
    return "video";
  }
  if (cleanUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)) {
    return "image";
  }

  return "unknown";
};

export const getStatusMainTaskColor = (status?: string) => {
  const s = (status || "").toUpperCase();
  switch (s) {
    case "TODO":
      return "default";
    case "PROGRESS":
      return "primary";
    case "DONE":
      return "success";
    default:
      return "default";
  }
};

export const getColumnStyleMainTas = (s: string) => {
  switch (s.toUpperCase()) {
    case "TODO":
      return {
        background: "bg-default-50/80 dark:bg-zinc-900/40", // พื้นหลังสีเทาลางๆ
        border:
          "border-t-4 border-t-default-400 dark:border-t-zinc-600 border-x-default-200 border-b-default-200 dark:border-x-zinc-800 dark:border-b-zinc-800",
        text: "text-default-700 dark:text-default-300",
        badge:
          "bg-default-200 text-default-700 dark:bg-zinc-700 dark:text-default-300",
        icon: "📋",
        label: "รอเริ่มงาน",
      };
    case "PROGRESS":
      return {
        background: "bg-primary-50/40 dark:bg-primary-900/10", // พื้นหลังสีน้ำเงินลางๆ
        border:
          "border-t-4 border-t-primary-500 border-x-primary-100 border-b-primary-100 dark:border-x-primary-900/30 dark:border-b-primary-900/30",
        text: "text-primary-600 dark:text-primary-400",
        badge:
          "bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400",
        icon: "⏳",
        label: "กำลังดำเนินการ",
      };
    case "DONE":
      return {
        background: "bg-success-50/40 dark:bg-success-900/10",
        border:
          "border-t-4 border-t-success-500 border-x-success-100 border-b-success-100 dark:border-x-success-900/30 dark:border-b-success-900/30",
        text: "text-success-600 dark:text-success-400",
        badge:
          "bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-400",
        icon: "✅",
        label: "เสร็จสมบูรณ์",
      };
    default:
      return {
        background: "bg-default-50/50 dark:bg-zinc-900/50",
        border:
          "border-t-4 border-t-zinc-500 border-x-default-200 border-b-default-200 dark:border-x-zinc-800 dark:border-b-zinc-800",
        text: "text-zinc-600 dark:text-zinc-400",
        badge: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
        icon: "📌",
        label: s,
      };
  }
};

export const calculateTaskProgress = (details: any[]) => {
  if (!details || details.length === 0) return 0;

  const totalWeight = details.reduce(
    (sum, sub) => sum + (Number(sub.weightPercent) || 0),
    0,
  );

  if (totalWeight === 0) {
    const completedCount = details.filter((sub) => sub.status).length;
    return Math.round((completedCount / details.length) * 100);
  }

  const completedWeight = details
    .filter((sub) => sub.status)
    .reduce((sum, sub) => sum + (Number(sub.weightPercent) || 0), 0);

  return Math.round((completedWeight / totalWeight) * 100);
};

// // สร้างไว้ให้ gen by AI
// const handleGenerateVideo = async () => {
//   setIsGeneratingVideo(true);
//   try {
//     const prompt_vdo = `Locked-off camera. Time-lapse shows the rapid construction of the modern building from an empty plot. Active construction cranes, workers, and materials are visible and moving fast. The surrounding environment, including the street, cars, trees, and lighting, remains perfectly identical to the reference image throughout the entire video. The building finishes exactly as shown in the reference. Realistic. exactly 8 seconds duration, 720p resolution, 16:9 aspect ratio`;
//     const startRes = await startVideoJob(prompt_vdo, projectInfo.image);

//     if (!startRes.success || !startRes.operationName) {
//       toast.error(startRes.error || "ไม่สามารถเริ่มสร้างวิดีโอได้");
//       setIsGeneratingVideo(false);
//       return;
//     }

//     toast.info(
//       "กำลังสร้างวิดีโอด้วย AI (อาจใช้เวลา 1-3 นาที) โปรดรอสักครู่...",
//     );
//     let isDone = false;
//     let finalVideoUrl = "";

//     while (!isDone) {
//       await new Promise((resolve) => setTimeout(resolve, 10000));
//       const checkRes = await checkVideoStatus(startRes.operationName);
//       if (checkRes.status === "success" && checkRes.videoUrl) {
//         isDone = true;
//         finalVideoUrl = checkRes.videoUrl;
//       } else if (checkRes.status === "error") {
//         isDone = true;
//         throw new Error(checkRes.error || "เกิดข้อผิดพลาดระหว่างสร้างวิดีโอ");
//       }
//     }

//     if (finalVideoUrl) {
//       if (projectInfo.video) {
//         try {
//           const urlObj = new URL(projectInfo.video);
//           let fileKey = urlObj.pathname.substring(1);
//           if (fileKey.startsWith("homex/"))
//             fileKey = fileKey.replace("homex/", "");
//           await deleteFileS3(fileKey);
//         } catch (err) {}
//       }
//       setProjectInfo((prev) => ({ ...prev, video: finalVideoUrl }));
//       await updateVdoProject(parseInt(projectInfo.id), finalVideoUrl);
//       toast.success("สร้างและบันทึกสำเร็จ!");
//     }
//   } catch (error) {
//     toast.error("เกิดข้อผิดพลาดในการสร้างวิดีโอ");
//   } finally {
//     setIsGeneratingVideo(false);
//   }
// };

// //สร้างไว้เผื่อใช้
// const handelGenerate3D = async () => {
//   setIsGeneratingVideo(true);
//   try {
//     let finalVideoUrl = await generationImage3D(
//       projectInfo.image,
//       projectProgress,
//     );
//     if (finalVideoUrl?.answer) {
//       if (projectInfo.video) {
//         try {
//           const urlObj = new URL(projectInfo.video);
//           let fileKey = urlObj.pathname.substring(1);
//           if (fileKey.startsWith("homex/"))
//             fileKey = fileKey.replace("homex/", "");
//           await deleteFileS3(fileKey);
//         } catch (err) {}
//       }
//       setProjectInfo((prev) => ({
//         ...prev,
//         video: finalVideoUrl?.answer || "",
//       }));
//       await updateVdoProject(parseInt(projectInfo.id), finalVideoUrl?.answer);
//       toast.success("สร้างและบันทึกสำเร็จ!");
//     }
//   } catch (error) {
//     toast.error("เกิดข้อผิดพลาดในการสร้างวิดีโอ");
//   } finally {
//     setIsGeneratingVideo(false);
//   }
// };

export const PROJECT_DOC_TYPES = [
  { key: "contract", label: "สัญญาจ้าง / LOI", textValue: "สัญญาจ้าง" },
  {
    key: "quotation",
    label: "ใบเสนอราคา (Quotation)",
    textValue: "ใบเสนอราคา",
  },
  {
    key: "invoice",
    label: "ใบแจ้งหนี้ / ใบเสร็จรับเงิน",
    textValue: "ใบแจ้งหนี้/ใบเสร็จ",
  },
  { key: "boq", label: "บัญชีรายการ / BOQ", textValue: "BOQ" },
  {
    key: "drawing_arch",
    label: "แบบแปลน / แบบออกแบบ",
    textValue: "แบบออกแบบ",
  },
  {
    key: "drawing_struct",
    label: "แบบโครงสร้าง / แบบทางเทคนิค",
    textValue: "แบบโครงสร้าง",
  },
  {
    key: "drawing_mep",
    label: "แบบระบบ / แบบเฉพาะทาง",
    textValue: "แบบระบบ",
  },
  {
    key: "as_built",
    label: "เอกสารสรุปผลงาน (Final Report)",
    textValue: "เอกสารสรุป",
  },
  {
    key: "shop_drawing",
    label: "แบบขยายรายละเอียด (Detail Drawing)",
    textValue: "แบบขยายรายละเอียด",
  },
  {
    key: "material_approval",
    label: "เอกสารอนุมัติวัสดุ/อุปกรณ์",
    textValue: "เอกสารอนุมัติวัสดุ",
  },
  {
    key: "daily_report",
    label: "รายงานประจำวัน (Daily Report)",
    textValue: "รายงานประจำวัน",
  },
  {
    key: "inspection",
    label: "ใบแจ้งตรวจงาน (Inspection)",
    textValue: "เอกสารตรวจสอบ",
  },
  {
    key: "permit",
    label: "ใบอนุญาต / เอกสารราชการ",
    textValue: "ใบอนุญาต",
  },
  { key: "others", label: "เอกสารอื่นๆ", textValue: "อื่นๆ" },
];

export function calculateRiskScore(metrics: ProjectMetricsBoard) {
  let score = 100; // เริ่มต้นที่ 100 คะแนนเต็ม
  let suggestion = "โครงการดำเนินไปได้ด้วยดี";

  // 📉 1. หักคะแนนความล่าช้าภาพรวม (ช้า 1% หัก 2 คะแนน)
  const scheduleDiff = metrics.plannedProgress - metrics.actualProgress;
  if (scheduleDiff > 0) {
    score -= scheduleDiff * 2;
  }

  // 📉 2. หักคะแนนงานย่อยที่ Delay (1 งาน หัก 3 คะแนน)
  if (metrics.delayTasksCount > 0) {
    score -= metrics.delayTasksCount * 3;
  }

  // 📉 3. หักคะแนนงบประมาณ (ถ้างบแซงหน้าความคืบหน้างานเกิน 10% จะเริ่มโดนหักหนักขึ้น)
  const budgetDiff = metrics.budgetSpentPercent - metrics.actualProgress;
  if (budgetDiff > 10) {
    score -= (budgetDiff - 10) * 1.5;
  }

  // ป้องกันไม่ให้คะแนนติดลบ
  score = Math.max(0, Math.round(score));

  // 📊 4. ตัดเกรดและกำหนดสี
  let grade = "";
  let riskLevel = "";
  let colorClass = "";

  if (score >= 90) {
    grade = "A";
    riskLevel = "ความเสี่ยงต่ำ";
    colorClass = "text-emerald-400";
  } else if (score >= 80) {
    grade = "B+";
    riskLevel = "ความเสี่ยงปานกลาง";
    colorClass = "text-emerald-400";
  } else if (score >= 70) {
    grade = "B";
    riskLevel = "ความเสี่ยงปานกลาง";
    colorClass = "text-yellow-400";
  } else if (score >= 60) {
    grade = "C";
    riskLevel = "ความเสี่ยงสูง";
    colorClass = "text-orange-400";
    suggestion = "ต้องรีบเร่งงาน งบเริ่มบานปลาย";
  } else {
    grade = "D";
    riskLevel = "วิกฤต";
    colorClass = "text-red-500";
    suggestion = "หยุดประเมินแผนด่วน! Overbudget หรือช้าเกินรับได้";
  }

  // 💬 ปรับคำแนะนำให้ตรงกับปัญหาหลัก (ถ้าเกรดระดับ B, B+)
  if (grade === "B+" || grade === "B") {
    if (budgetDiff > 20) {
      suggestion = "เฝ้าระวังงบประมาณ (ใช้เงินเร็วกว่าเนื้องาน)";
    } else if (metrics.delayTasksCount >= 3) {
      suggestion = "เฝ้าระวังงานย่อยค้างสะสม (Delay)";
    } else if (scheduleDiff > 0) {
      suggestion = "เร่งรัดแผนงานหลักที่ล่าช้า";
    }
  }

  return { score, grade, riskLevel, suggestion, colorClass };
}
