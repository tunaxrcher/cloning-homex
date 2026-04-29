"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getContractors(organizationId: number) {
  try {
    if (!organizationId) return [];

    return await prisma.contractor.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: { id: "desc" },
    });
  } catch {
    return [];
  }
}
/* ====================================================== */
/* ADD TASK CONTRACTORS */
/* ====================================================== */
export async function addTaskContractors(
  taskId: number,
  contractorIds: number[]
) {
  try {
    if (!taskId || !contractorIds.length) {
      return { success: false };
    }

    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);

    if (!organizationId) return { success: false };

    const data = contractorIds.map((id) => ({
      taskId,
      contractorId: id,
      organizationId,
    }));

    await prisma.task_contractor.createMany({
      data,
      skipDuplicates: true,
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}

/* ====================================================== */
/* GET TASK CONTRACTORS */
/* ====================================================== */
export async function getTaskContractors(taskId: number) {
  try {
    if (!taskId) return [];

    const contractors = await prisma.task_contractor.findMany({
      where: { taskId },
      include: {
        contractor: {
          select: {
            id: true,
            contractorName: true,
            contractorPhone: true,
          },
        },
      },
    });

    return contractors.map((c) => c.contractor);
  } catch {
    return [];
  }
}

/* ====================================================== */
/* REMOVE TASK CONTRACTOR */
/* ====================================================== */
export async function removeTaskContractor(
  taskId: number,
  contractorId: number
) {
  try {
    await prisma.task_contractor.deleteMany({
      where: {
        taskId,
        contractorId,
      },
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}