"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

/* ====================================================== */
/* GET PROJECT MEMBERS */
/* ดึงสมาชิกในโปรเจค (จาก project_user) */
/* ใช้ตอนเลือก assignee ตอนสร้าง task */
/* ====================================================== */

export async function getProjectMembers(projectId: number) {
  try {
    if (!projectId) return [];

    const members = await prisma.project_user.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            position: {
              select: {
                positionName: true,
              },
            },
          },
        },
      },
    });

    return members.map((m) => m.user);
  } catch {
    return [];
  }
}

/* ====================================================== */
/* ADD TASK MEMBERS */
/* เพิ่มผู้รับผิดชอบ task ลง table task_user */
/* ====================================================== */

export async function addTaskMembers(taskId: number, userIds: number[]) {
  try {
    if (!taskId || !userIds.length) {
      return { success: false };
    }

    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);

    if (!organizationId) {
      return { success: false };
    }

    const data = userIds.map((id) => ({
      taskId,
      userId: id,
      organizationId,
    }));

    await prisma.task_user.createMany({
      data,
      skipDuplicates: true,
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}

/* ====================================================== */
/* GET TASK MEMBERS */
/* ดึงผู้รับผิดชอบของ task */
/* ใช้ตอนแสดง Avatar ใน UI */
/* ====================================================== */

export async function getTaskMembers(taskId: number) {
  try {
    if (!taskId) return [];

    const members = await prisma.task_user.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            position: {
              select: {
                positionName: true,
              },
            },
          },
        },
      },
    });

    return members.map((m) => m.user);
  } catch {
    return [];
  }
}

/* ====================================================== */
/* REMOVE TASK MEMBER */
/* ลบผู้รับผิดชอบออกจาก task */
/* ====================================================== */

export async function removeTaskMember(taskId: number, userId: number) {
  try {
    await prisma.task_user.deleteMany({
      where: {
        taskId,
        userId,
      },
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}
