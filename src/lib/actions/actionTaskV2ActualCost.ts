"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import type { ActionState, ActualCostCategory } from "@/lib/type";

// =====================================
// Create — เพิ่มรายการงบประมาณจริง
// =====================================
export async function createActualCost(data: {
  taskId: number;
  organizationId: number;
  category: ActualCostCategory;
  amount: number;
  description?: string;
  imageUrl?: string;
}): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    if (!data.taskId || !data.amount || !data.category) {
      return { success: false, error: true, message: "ข้อมูลไม่ครบถ้วน" };
    }

    const entry = await prisma.task_actual_cost.create({
      data: {
        category: data.category,
        amount: data.amount,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        taskId: data.taskId,
        organizationId: data.organizationId,
        createdById: parseInt(session.user.id),
      },
    });

    return {
      success: true,
      error: false,
      message: "บันทึกรายการสำเร็จ",
      data: JSON.parse(JSON.stringify(entry)),
    };
  } catch (error: any) {
    console.error("createActualCost Error:", error);
    return {
      success: false,
      error: true,
      message: error.message || "ไม่สามารถบันทึกรายการได้",
    };
  }
}

// =====================================
// Read — ดึงรายการทั้งหมดของ Task
// =====================================
export async function getActualCostEntries(taskId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, data: [] };
    }

    const entries = await prisma.task_actual_cost.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: { id: true, displayName: true },
        },
      },
    });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(entries)),
    };
  } catch (error: any) {
    console.error("getActualCostEntries Error:", error);
    return { success: false, data: [] };
  }
}

// =====================================
// Summary — สรุปยอดรวมแยกหมวดหมู่ (ใช้ groupBy ให้ DB ทำงาน)
// =====================================
export async function getActualCostSummary(taskId: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, data: { material: 0, labor: 0, machinery: 0, total: 0 } };
    }

    const grouped = await prisma.task_actual_cost.groupBy({
      by: ["category"],
      where: { taskId },
      _sum: { amount: true },
    });

    let material = 0;
    let labor = 0;
    let machinery = 0;

    for (const g of grouped) {
      const amt = Number(g._sum.amount) || 0;
      if (g.category === "MATERIAL") material = amt;
      else if (g.category === "LABOR") labor = amt;
      else if (g.category === "MACHINERY") machinery = amt;
    }

    return {
      success: true,
      data: { material, labor, machinery, total: material + labor + machinery },
    };
  } catch (error: any) {
    console.error("getActualCostSummary Error:", error);
    return {
      success: false,
      data: { material: 0, labor: 0, machinery: 0, total: 0 },
    };
  }
}

// =====================================
// Delete — ลบรายการ
// =====================================
export async function deleteActualCost(id: number): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    const entry = await prisma.task_actual_cost.findUnique({ where: { id } });
    if (!entry) {
      return { success: false, error: true, message: "ไม่พบรายการ" };
    }
    if (entry.createdById !== parseInt(session.user.id)) {
      return { success: false, error: true, message: "คุณไม่มีสิทธิ์ลบรายการนี้" };
    }

    await prisma.task_actual_cost.delete({ where: { id } });

    return { success: true, error: false, message: "ลบรายการสำเร็จ" };
  } catch (error: any) {
    console.error("deleteActualCost Error:", error);
    return {
      success: false,
      error: true,
      message: error.message || "ไม่สามารถลบรายการได้",
    };
  }
}

// =====================================
// Update Custom Budget — ตั้งราคากลางสุทธิเอง
// =====================================
export async function updateTaskCustomBudget(
  taskId: number,
  budget: number,
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { budget, updatedAt: new Date() },
    });

    return { success: true, error: false, message: "บันทึกราคากลางสุทธิสำเร็จ" };
  } catch (error: any) {
    console.error("updateTaskCustomBudget Error:", error);
    return {
      success: false,
      error: true,
      message: error.message || "ไม่สามารถบันทึกราคากลางสุทธิได้",
    };
  }
}
