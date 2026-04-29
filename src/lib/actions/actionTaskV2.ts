"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import type { ActionState, TaskV2AIResponse } from "@/lib/type";

/* ====================================================== */
/* CREATE TASK V2 (simple: just name → AI fills the rest) */
/* ====================================================== */
export async function createTaskV2(
  taskName: string,
  projectId: number,
  organizationId: number,
  coverImageUrl?: string,
  aiRefDescription?: string,
  aiRefImages?: string[], // JSON array of image URLs
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    if (!taskName.trim()) {
      return { success: false, error: true, message: "กรุณากรอกชื่องาน" };
    }

    const task = await prisma.task.create({
      data: {
        taskName: taskName.trim(),
        status: "TODO",
        progressPercent: 0,
        coverImageUrl: coverImageUrl || "",
        organizationId,
        projectId,
        createdById: Number(session.user.id),
        aiRefDescription: aiRefDescription || null,
        aiRefImages: aiRefImages && aiRefImages.length > 0 ? JSON.stringify(aiRefImages) : null,
      },
    });

    return {
      success: true,
      error: false,
      message: "สร้างงานสำเร็จ",
      taskId: task.id,
    };
  } catch (error: any) {
    console.error("createTaskV2 error:", error);
    return {
      success: false,
      error: true,
      message: error.message || "สร้างงานไม่สำเร็จ",
    };
  }
}

/* ====================================================== */
/* UPDATE TASK V2 INFO (ชื่อ, คำอธิบาย, รูปอ้างอิง, Phase, Planned dates) */
/* ====================================================== */
export async function updateTaskV2Info(
  taskId: number,
  data: {
    taskName?: string;
    aiRefDescription?: string | null;
    aiRefImages?: string[] | null;
    phase?: string | null;
    startPlanned?: string | null;
    finishPlanned?: string | null;
  }
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    const updateData: any = {};
    if (data.taskName !== undefined) {
      if (!data.taskName.trim()) {
        return { success: false, error: true, message: "ชื่องานต้องไม่ว่าง" };
      }
      updateData.taskName = data.taskName.trim();
    }
    if (data.aiRefDescription !== undefined) {
      updateData.aiRefDescription = data.aiRefDescription;
    }
    if (data.aiRefImages !== undefined) {
      updateData.aiRefImages = data.aiRefImages ? JSON.stringify(data.aiRefImages) : null;
    }
    if (data.phase !== undefined) {
      updateData.phase = data.phase;
    }
    if (data.startPlanned !== undefined) {
      updateData.startPlanned = data.startPlanned ? new Date(data.startPlanned) : null;
    }
    if (data.finishPlanned !== undefined) {
      updateData.finishPlanned = data.finishPlanned ? new Date(data.finishPlanned) : null;
    }

    await prisma.task.update({ where: { id: taskId }, data: updateData });

    return { success: true, error: false, message: "อัปเดตข้อมูลงานสำเร็จ" };
  } catch (error: any) {
    console.error("updateTaskV2Info error:", error);
    return { success: false, error: true, message: error.message || "อัปเดตไม่สำเร็จ" };
  }
}

/* ====================================================== */
/* REPLACE AI DATA (ลบ subtasks เก่า + เขียน AI data ใหม่)  */
/* ====================================================== */
export async function replaceTaskV2AiData(
  taskId: number,
  projectId: number,
  organizationId: number,
  aiData: TaskV2AIResponse
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete old subtasks
      await tx.task_detail.deleteMany({ where: { taskId } });

      // 2. Save new AI data + reset status
      await tx.task.update({
        where: { id: taskId },
        data: {
          ...buildAiUpdateData(aiData),
          progressPercent: 0,
          status: "TODO",
        },
      });

      // 3. Create new subtasks from checklist
      if (aiData.checklist && aiData.checklist.length > 0) {
        const subtaskData = aiData.checklist.map((item, index) => ({
          detailName: item.name,
          detailDesc: "",
          status: false,
          weightPercent: item.progressPercent,
          progressPercent: 0,
          sortOrder: index,
          taskId,
          projectId,
          organizationId,
        }));
        await tx.task_detail.createMany({ data: subtaskData });
      }
    });

    return { success: true, error: false, message: "วิเคราะห์ใหม่และบันทึกสำเร็จ" };
  } catch (error: any) {
    console.error("replaceTaskV2AiData error:", error);
    return { success: false, error: true, message: error.message || "บันทึกไม่สำเร็จ" };
  }
}

/* ====================================================== */
/* HELPER: Build AI data update payload (shared)           */
/* ====================================================== */
function buildAiUpdateData(aiData: TaskV2AIResponse) {
  return {
    estimatedBudget: aiData.costEstimation.totalEstimate,
    aiMaterialPercent: aiData.costEstimation.breakdown.materialPercent,
    aiMaterialCost: aiData.costEstimation.breakdown.materialCost,
    aiLaborPercent: aiData.costEstimation.breakdown.laborPercent,
    aiLaborCost: aiData.costEstimation.breakdown.laborCost,
    aiMachineryPercent: aiData.costEstimation.breakdown.machineryPercent,
    aiMachineryCost: aiData.costEstimation.breakdown.machineryCost,
    estimatedDurationDays: aiData.durationEstimate.totalDays,
    aiDurationAssumptions: aiData.durationEstimate.assumptions,
    aiRisks: JSON.stringify(aiData.risks),
    aiMaterials: JSON.stringify(aiData.materials),
    phase: aiData.phase,
  };
}

/* ====================================================== */
/* SAVE AI DATA → เขียนลงฟิลด์ต่าง ๆ ใน task โดยตรง       */
/* (ใช้ตอนสร้างครั้งแรก)                                   */
/* ====================================================== */
export async function saveTaskV2AiData(
  taskId: number,
  aiData: TaskV2AIResponse
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    await prisma.task.update({
      where: { id: taskId },
      data: buildAiUpdateData(aiData),
    });

    return { success: true, error: false, message: "บันทึกข้อมูล AI สำเร็จ" };
  } catch (error: any) {
    console.error("saveTaskV2AiData error:", error);
    return {
      success: false,
      error: true,
      message: error.message || "บันทึกข้อมูล AI ไม่สำเร็จ",
    };
  }
}

/* ====================================================== */
/* GET AI DATA → อ่านจาก task แล้วประกอบเป็น TaskV2AIResponse */
/* ====================================================== */
export async function getTaskV2AiData(
  taskId: number
): Promise<TaskV2AIResponse | null> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        estimatedBudget: true,
        aiMaterialPercent: true,
        aiMaterialCost: true,
        aiLaborPercent: true,
        aiLaborCost: true,
        aiMachineryPercent: true,
        aiMachineryCost: true,
        estimatedDurationDays: true,
        aiDurationAssumptions: true,
        aiRisks: true,
        aiMaterials: true,
        phase: true,
      },
    });

    if (!task) return null;

    // ถ้ายังไม่เคยมี AI data (ฟิลด์หลัก ๆ เป็น null) ก็คืน null
    if (task.estimatedBudget == null && task.aiRisks == null) return null;

    let risks = [];
    try {
      risks = task.aiRisks ? JSON.parse(task.aiRisks) : [];
    } catch {
      risks = [];
    }

    let materials = [];
    try {
      materials = task.aiMaterials ? JSON.parse(task.aiMaterials) : [];
    } catch {
      materials = [];
    }

    return {
      costEstimation: {
        totalEstimate: Number(task.estimatedBudget) || 0,
        breakdown: {
          materialPercent: task.aiMaterialPercent ?? 0,
          materialCost: Number(task.aiMaterialCost) || 0,
          laborPercent: task.aiLaborPercent ?? 0,
          laborCost: Number(task.aiLaborCost) || 0,
          machineryPercent: task.aiMachineryPercent ?? 0,
          machineryCost: Number(task.aiMachineryCost) || 0,
        },
      },
      durationEstimate: {
        totalDays: task.estimatedDurationDays ?? 0,
        assumptions: task.aiDurationAssumptions || "",
      },
      risks,
      materials,
      checklist: [], // checklist ดึงจาก task_detail (subtasks) แทน
      phase: task.phase || "",
    };
  } catch {
    return null;
  }
}

/* ====================================================== */
/* UPDATE TASK PROGRESS จาก Checklist (subtask toggle)    */
/* ====================================================== */
export async function updateTaskV2Progress(
  taskId: number
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    const subtasks = await prisma.task_detail.findMany({
      where: { taskId },
      select: { status: true },
    });

    const totalItems = subtasks.length;
    const checkedItems = subtasks.filter((s) => s.status === true).length;
    const progress =
      totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    await prisma.task.update({
      where: { id: taskId },
      data: {
        progressPercent: progress,
        status:
          progress === 100 ? "DONE" : progress > 0 ? "PROGRESS" : "TODO",
      },
    });

    return {
      success: true,
      error: false,
      message: "อัปเดต Progress สำเร็จ",
      data: { progress },
    };
  } catch (error: any) {
    console.error("updateTaskV2Progress error:", error);
    return {
      success: false,
      error: true,
      message: error.message || "อัปเดตไม่สำเร็จ",
    };
  }
}

/* ====================================================== */
/* CREATE CHECKLIST AS SUBTASKS (task_detail)             */
/* ====================================================== */
export async function createV2ChecklistAsSubtasks(
  taskId: number,
  projectId: number,
  organizationId: number,
  checklist: { name: string; progressPercent: number }[]
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    const data = checklist.map((item, index) => ({
      detailName: item.name,
      detailDesc: "",
      status: false,
      weightPercent: item.progressPercent,
      progressPercent: 0,
      sortOrder: index,
      taskId,
      projectId,
      organizationId,
    }));

    await prisma.task_detail.createMany({ data });

    return {
      success: true,
      error: false,
      message: "สร้าง Checklist สำเร็จ",
    };
  } catch (error: any) {
    console.error("createV2ChecklistAsSubtasks error:", error);
    return {
      success: false,
      error: true,
      message: error.message || "สร้าง Checklist ไม่สำเร็จ",
    };
  }
}

/* ====================================================== */
/* REORDER SUBTASKS (update sortOrder)                    */
/* ====================================================== */
export async function reorderSubtasks(
  orderedIds: number[]
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.task_detail.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    return { success: true, error: false, message: "จัดเรียงสำเร็จ" };
  } catch (error: any) {
    console.error("reorderSubtasks error:", error);
    return {
      success: false,
      error: true,
      message: error.message || "จัดเรียงไม่สำเร็จ",
    };
  }
}

/* ====================================================== */
/* EDIT SUBTASK NAME                                      */
/* ====================================================== */
export async function editSubtaskName(
  subtaskId: number,
  newName: string
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    if (!newName.trim()) {
      return { success: false, error: true, message: "ชื่อต้องไม่ว่าง" };
    }

    await prisma.task_detail.update({
      where: { id: subtaskId },
      data: { detailName: newName.trim() },
    });

    return { success: true, error: false, message: "แก้ไขสำเร็จ" };
  } catch (error: any) {
    console.error("editSubtaskName error:", error);
    return {
      success: false,
      error: true,
      message: error.message || "แก้ไขไม่สำเร็จ",
    };
  }
}
