"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ActionState } from "@/lib/type";

/* ====================================================== */
/* ADD PROJECT MEMBER */
/* ====================================================== */

export async function addProjectMember(
  projectId: number,
  userId: number,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);

    if (!organizationId) {
      return {
        success: false,
        error: true,
        message: "ไม่พบ organization",
      };
    }

    /* 🔎 CHECK DUPLICATE */

    const exists = await prisma.project_user.findFirst({
      where: {
        projectId,
        userId,
        organizationId,
      },
    });

    if (exists) {
      return {
        success: false,
        error: true,
        message: "พนักงานอยู่ในโปรเจคแล้ว",
      };
    }

    await prisma.project_user.create({
      data: {
        projectId,
        userId,
        organizationId,
      },
    });

    return {
      success: true,
      error: false,
    };
  } catch {
    return {
      success: false,
      error: true,
      message: "ไม่สามารถเพิ่มสมาชิกได้",
    };
  }
}

/* ====================================================== */
/* REMOVE PROJECT MEMBER */
/* ====================================================== */
export async function removeProjectMember(
  id: number,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);

    if (!organizationId) {
      return {
        success: false,
        error: true,
        message: "ไม่พบ organization",
      };
    }

    /* 🔎 CHECK EXIST */
    const exists = await prisma.project_user.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!exists) {
      return {
        success: false,
        error: true,
        message: "ไม่พบสมาชิกในโปรเจค",
      };
    }

    await prisma.project_user.delete({
      where: { id },
    });

    return {
      success: true,
      error: false,
    };
  } catch {
    return {
      success: false,
      error: true,
      message: "ไม่สามารถลบสมาชิกได้",
    };
  }
}