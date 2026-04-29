"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ActionState, CreatePermissionData } from "@/lib/type";

/* ====================================================== */
/* CREATE PERMISSION */
/* ====================================================== */

export async function createPermission(
  data: CreatePermissionData,
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

    const permissionKey = data.permissionKey?.trim().toUpperCase();
    const permissionName = data.permissionName?.trim();
    const permissionDesc = data.permissionDesc?.trim();

    if (!permissionKey || !permissionName) {
      return {
        success: false,
        error: true,
        message: "กรุณากรอกข้อมูลให้ครบ",
      };
    }

    /* 🔎 CHECK KEY DUPLICATE */

    const existsKey = await prisma.permission.findFirst({
      where: {
        organizationId,
        permissionKey,
      },
    });

    if (existsKey) {
      return {
        success: false,
        error: true,
        message: "Permission Key นี้ถูกใช้แล้ว",
      };
    }

    /* 🔎 CHECK NAME DUPLICATE */

    const existsName = await prisma.permission.findFirst({
      where: {
        organizationId,
        permissionName,
      },
    });

    if (existsName) {
      return {
        success: false,
        error: true,
        message: "ชื่อ Permission นี้ถูกใช้แล้ว",
      };
    }

    await prisma.permission.create({
      data: {
        permissionKey,
        permissionName,
        permissionDesc: permissionDesc || null,
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
      message: "ไม่สามารถสร้าง Permission ได้",
    };
  }
}

/* ====================================================== */
/* UPDATE PERMISSION */
/* ====================================================== */

export async function updatePermission(
  id: number,
  data: CreatePermissionData,
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

    const permissionKey = data.permissionKey?.trim().toUpperCase();
    const permissionName = data.permissionName?.trim();
    const permissionDesc = data.permissionDesc?.trim();

    if (!permissionKey || !permissionName) {
      return {
        success: false,
        error: true,
        message: "กรุณากรอกข้อมูลให้ครบ",
      };
    }

    /* 🔎 CHECK EXIST */

    const exists = await prisma.permission.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!exists) {
      return {
        success: false,
        error: true,
        message: "ไม่พบ Permission นี้",
      };
    }

    /* 🔎 CHECK KEY DUPLICATE */

    const existsKey = await prisma.permission.findFirst({
      where: {
        organizationId,
        permissionKey,
        NOT: {
          id,
        },
      },
    });

    if (existsKey) {
      return {
        success: false,
        error: true,
        message: "Permission Key นี้ถูกใช้แล้ว",
      };
    }

    /* 🔎 CHECK NAME DUPLICATE */

    const existsName = await prisma.permission.findFirst({
      where: {
        organizationId,
        permissionName,
        NOT: {
          id,
        },
      },
    });

    if (existsName) {
      return {
        success: false,
        error: true,
        message: "ชื่อ Permission นี้ถูกใช้แล้ว",
      };
    }

    await prisma.permission.update({
      where: { id },
      data: {
        permissionKey,
        permissionName,
        permissionDesc: permissionDesc || null,
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
      message: "ไม่สามารถแก้ไข Permission ได้",
    };
  }
}

/* ====================================================== */
/* DELETE */
/* ====================================================== */

export async function deletePermission(
  id: number,
): Promise<ActionState> {
  try {
    await prisma.permission.update({
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
      message: "ไม่สามารถปิด Permission ได้",
    };
  }
}

/* ====================================================== */
/* RESTORE */
/* ====================================================== */

export async function restorePermission(
  id: number,
): Promise<ActionState> {
  try {
    await prisma.permission.update({
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
      message: "ไม่สามารถเปิด Permission ได้",
    };
  }
}   