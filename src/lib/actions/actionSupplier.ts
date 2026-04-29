"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ActionState, CreateSupplierData } from "@/lib/type";

/* ====================================================== */
/* GET SUPPLIERS (active only)                            */
/* ====================================================== */

export async function getSuppliers(orgId: number) {
  try {
    return await prisma.supplier.findMany({
      where: { organizationId: orgId, isActive: true },
      orderBy: { supplierName: "asc" },
      select: { id: true, supplierName: true, contactPerson: true },
    });
  } catch {
    return [];
  }
}

/* ====================================================== */
/* CREATE SUPPLIER */
/* ====================================================== */

export async function createSupplier(
  data: CreateSupplierData,
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

    const supplierName = data.supplierName?.trim();
    const supplierPhone = data.supplierPhone?.trim();
    const supplierEmail = data.supplierEmail?.trim();
    const supplierAddress = data.supplierAddress?.trim();
    const supplierDesc = data.supplierDesc?.trim();

    if (!supplierName) {
      return {
        success: false,
        error: true,
        message: "กรุณากรอกชื่อซัพพลายเออร์",
      };
    }

    /* 🔎 CHECK DUPLICATE NAME */

    const exists = await prisma.supplier.findFirst({
      where: {
        organizationId,
        supplierName,
      },
    });

    if (exists) {
      return {
        success: false,
        error: true,
        message: "ชื่อซัพพลายเออร์นี้ถูกใช้แล้ว",
      };
    }

    await prisma.supplier.create({
      data: {
        supplierName,
        supplierPhone: supplierPhone || null,
        supplierEmail: supplierEmail || null,
        supplierAddress: supplierAddress || null,
        supplierDesc: supplierDesc || null,
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
      message: "ไม่สามารถสร้างซัพพลายเออร์ได้",
    };

  }

}

/* ====================================================== */
/* UPDATE SUPPLIER */
/* ====================================================== */

export async function updateSupplier(
  id: number,
  data: CreateSupplierData,
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

    const supplierName = data.supplierName?.trim();
    const supplierPhone = data.supplierPhone?.trim();
    const supplierEmail = data.supplierEmail?.trim();
    const supplierAddress = data.supplierAddress?.trim();
    const supplierDesc = data.supplierDesc?.trim();

    if (!supplierName) {
      return {
        success: false,
        error: true,
        message: "กรุณากรอกชื่อซัพพลายเออร์",
      };
    }

    /* 🔎 CHECK EXIST */

    const exists = await prisma.supplier.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!exists) {
      return {
        success: false,
        error: true,
        message: "ไม่พบซัพพลายเออร์นี้",
      };
    }

    /* 🔎 CHECK DUPLICATE NAME */

    const existsName = await prisma.supplier.findFirst({
      where: {
        organizationId,
        supplierName,
        NOT: { id },
      },
    });

    if (existsName) {
      return {
        success: false,
        error: true,
        message: "ชื่อซัพพลายเออร์นี้ถูกใช้แล้ว",
      };
    }

    await prisma.supplier.update({
      where: { id },
      data: {
        supplierName,
        supplierPhone: supplierPhone || null,
        supplierEmail: supplierEmail || null,
        supplierAddress: supplierAddress || null,
        supplierDesc: supplierDesc || null,
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
      message: "ไม่สามารถแก้ไขซัพพลายเออร์ได้",
    };

  }

}

/* ====================================================== */
/* DELETE SUPPLIER */
/* ====================================================== */

export async function deleteSupplier(
  id: number,
): Promise<ActionState> {

  try {

    await prisma.supplier.update({
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
      message: "ไม่สามารถปิดซัพพลายเออร์ได้",
    };

  }

}

/* ====================================================== */
/* RESTORE SUPPLIER */
/* ====================================================== */

export async function restoreSupplier(
  id: number,
): Promise<ActionState> {

  try {

    await prisma.supplier.update({
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
      message: "ไม่สามารถเปิดซัพพลายเออร์ได้",
    };

  }

}