"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import type { ActionState } from "@/lib/type";

/* ====================================================== */
/* ADD MATERIAL TO PROCUREMENT (create suggestion)        */
/* ====================================================== */
export async function addMaterialToProcurement(params: {
  materialName: string;
  specification?: string;
  quantity?: string;
  unit?: string;
  unitPrice?: number;
  totalPrice?: number;
  taskId: number;
  projectId: number;
  organizationId: number;
}): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    if (!params.materialName.trim()) {
      return { success: false, error: true, message: "ชื่อวัสดุต้องไม่ว่าง" };
    }

    // Check duplicate (same task + materialName)
    const existing = await prisma.procurement_suggestion.findFirst({
      where: {
        taskId: params.taskId,
        materialName: params.materialName,
        status: "PENDING",
      },
    });

    if (existing) {
      return { success: false, error: true, message: "รายการนี้ถูกเพิ่มไปแล้ว" };
    }

    await prisma.procurement_suggestion.create({
      data: {
        materialName: params.materialName.trim(),
        specification: params.specification || null,
        quantity: params.quantity || null,
        unit: params.unit || null,
        unitPrice: params.unitPrice ?? null,
        totalPrice: params.totalPrice ?? null,
        taskId: params.taskId,
        projectId: params.projectId,
        organizationId: params.organizationId,
        createdById: Number(session.user.id),
      },
    });

    return { success: true, error: false, message: "เพิ่มไปที่จัดซื้อสำเร็จ" };
  } catch (error: any) {
    console.error("addMaterialToProcurement error:", error);
    return {
      success: false,
      error: true,
      message: error.message || "เพิ่มไม่สำเร็จ",
    };
  }
}

/* ====================================================== */
/* GET ADDED MATERIAL NAMES for a task                    */
/* ====================================================== */
export async function getAddedMaterialNames(taskId: number): Promise<string[]> {
  try {
    const items = await prisma.procurement_suggestion.findMany({
      where: { taskId },
      select: { materialName: true },
    });
    return items.map((i) => i.materialName);
  } catch {
    return [];
  }
}

/* ====================================================== */
/* GET PROCUREMENT SUGGESTIONS for a project              */
/* ====================================================== */
export async function getProcurementSuggestions(projectId: number) {
  try {
    const suggestions = await prisma.procurement_suggestion.findMany({
      where: { projectId, status: "PENDING" },
      include: {
        task: { select: { id: true, taskName: true, coverImageUrl: true } },
        creator: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return suggestions.map((s) => ({
      id: s.id,
      materialName: s.materialName,
      specification: s.specification,
      quantity: s.quantity,
      unit: s.unit,
      unitPrice: s.unitPrice ? Number(s.unitPrice) : null,
      totalPrice: s.totalPrice ? Number(s.totalPrice) : null,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      taskId: s.taskId,
      taskName: s.task.taskName,
      taskCoverImage: s.task.coverImageUrl,
      creatorName: s.creator.displayName,
    }));
  } catch (error) {
    console.error("getProcurementSuggestions error:", error);
    return [];
  }
}

/* ====================================================== */
/* CONVERT SUGGESTION → real procurement_item             */
/* ====================================================== */
export async function convertSuggestionToProcurement(
  suggestionId: number
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    const suggestion = await prisma.procurement_suggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      return { success: false, error: true, message: "ไม่พบรายการ" };
    }

    // Create real procurement item
    const item = await prisma.procurement_item.create({
      data: {
        materialName: suggestion.materialName,
        specification: suggestion.specification,
        unit: suggestion.unit,
        quantity: suggestion.quantity ? Number(suggestion.quantity) : null,
        status: "PENDING",
        projectId: suggestion.projectId,
        organizationId: suggestion.organizationId,
        createdById: Number(session.user.id),
      },
    });

    // Link to task
    if (suggestion.taskId) {
      await prisma.procurement_task_link.create({
        data: {
          procurementItemId: item.id,
          taskId: suggestion.taskId,
          linkedBy: "AI_SUGGESTED",
        },
      });
    }

    // Mark suggestion as ADDED
    await prisma.procurement_suggestion.update({
      where: { id: suggestionId },
      data: { status: "ADDED" },
    });

    return {
      success: true,
      error: false,
      message: "เพิ่มลงรายการจัดซื้อสำเร็จ",
    };
  } catch (error: any) {
    console.error("convertSuggestionToProcurement error:", error);
    return {
      success: false,
      error: true,
      message: error.message || "เพิ่มไม่สำเร็จ",
    };
  }
}

/* ====================================================== */
/* DELETE SUGGESTION                                      */
/* ====================================================== */
export async function deleteProcurementSuggestion(
  suggestionId: number
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    await prisma.procurement_suggestion.delete({
      where: { id: suggestionId },
    });

    return { success: true, error: false, message: "ลบรายการสำเร็จ" };
  } catch (error: any) {
    console.error("deleteProcurementSuggestion error:", error);
    return {
      success: false,
      error: true,
      message: error.message || "ลบไม่สำเร็จ",
    };
  }
}
