"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ActionState, CreatePositionData } from "@/lib/type";

/* ====================================================== */
/* CREATE POSITION */
/* ====================================================== */

export async function createPosition(
  data: CreatePositionData,
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

    const positionName = data.positionName?.trim();
    const positionDesc = data.positionDesc?.trim();

    if (!positionName) {
      return {
        success: false,
        error: true,
        message: "กรุณากรอกชื่อตำแหน่ง",
      };
    }

    /* 🔎 CHECK DUPLICATE */
    const exists = await prisma.position.findFirst({
      where: {
        organizationId,
        positionName,
      },
    });

    if (exists) {
      return {
        success: false,
        error: true,
        message: "ชื่อตำแหน่งนี้ถูกใช้แล้ว",
      };
    }

    await prisma.position.create({
      data: {
        positionName,
        positionDesc: positionDesc || null,
        organizationId,
        isActive: true,
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
      message: "ไม่สามารถสร้างตำแหน่งได้",
    };
  }
}

/* ====================================================== */
/* UPDATE POSITION */
/* ====================================================== */

export async function updatePosition(
  id: number,
  data: CreatePositionData,
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

    const positionName = data.positionName?.trim();
    const positionDesc = data.positionDesc?.trim();

    if (!positionName) {
      return {
        success: false,
        error: true,
        message: "กรุณากรอกชื่อตำแหน่ง",
      };
    }

    /* 🔎 CHECK EXIST */
    const exists = await prisma.position.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!exists) {
      return {
        success: false,
        error: true,
        message: "ไม่พบตำแหน่งนี้",
      };
    }

    /* 🔎 CHECK DUPLICATE */
    const duplicate = await prisma.position.findFirst({
      where: {
        organizationId,
        positionName,
        NOT: {
          id,
        },
      },
    });

    if (duplicate) {
      return {
        success: false,
        error: true,
        message: "ชื่อตำแหน่งนี้ถูกใช้แล้ว",
      };
    }

    await prisma.position.update({
      where: { id },
      data: {
        positionName,
        positionDesc: positionDesc || null,
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
      message: "ไม่สามารถแก้ไขตำแหน่งได้",
    };
  }
}

/* ====================================================== */
/* DELETE (SOFT DELETE) */
/* ====================================================== */

export async function deletePosition(
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

    const position = await prisma.position.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!position) {
      return {
        success: false,
        error: true,
        message: "ไม่พบตำแหน่งนี้",
      };
    }

    /* 🔥 ป้องกันปิดตำแหน่งที่มี user ใช้อยู่ */
    const activeUserCount = await prisma.user.count({
      where: {
        positionId: id,
        organizationId,
        isActive: true,
      },
    });

    if (activeUserCount > 0) {
      return {
        success: false,
        error: true,
        message: "ไม่สามารถปิดตำแหน่งที่มีผู้ใช้งานอยู่ได้",
      };
    }

    await prisma.position.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      success: true,
      error: false,
    };
  } catch {
    return {
      success: false,
      error: true,
      message: "ไม่สามารถปิดตำแหน่งได้",
    };
  }
}

/* ====================================================== */
/* RESTORE */
/* ====================================================== */

export async function restorePosition(
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

    const exists = await prisma.position.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!exists) {
      return {
        success: false,
        error: true,
        message: "ไม่พบตำแหน่งนี้",
      };
    }

    await prisma.position.update({
      where: { id },
      data: { isActive: true },
    });

    return {
      success: true,
      error: false,
    };
  } catch {
    return {
      success: false,
      error: true,
      message: "ไม่สามารถเปิดใช้งานตำแหน่งได้",
    };
  }
}