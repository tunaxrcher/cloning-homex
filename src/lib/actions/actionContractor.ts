"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ActionState, CreateContractorData } from "@/lib/type";

/* ====================================================== */
/* CREATE CONTRACTOR */
/* ====================================================== */
export async function createContractor(
  data: CreateContractorData,
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
    const contractorName = data.contractorName?.trim();
    const contractorPhone = data.contractorPhone?.trim();
    const contractorEmail = data.contractorEmail?.trim();
    const contractorAddress = data.contractorAddress?.trim();
    const contractorDesc = data.contractorDesc?.trim();

    if (!contractorName) {
      return {
        success: false,
        error: true,
        message: "กรุณากรอกชื่อผู้รับจ้าง",
      };
    }

    /* 🔎 CHECK DUPLICATE NAME */
    const exists = await prisma.contractor.findFirst({
      where: {
        organizationId,
        contractorName,
      },
    });
    if (exists) {
      return {
        success: false,
        error: true,
        message: "ชื่อผู้รับจ้างนี้ถูกใช้แล้ว",
      };
    }
    await prisma.contractor.create({
      data: {
        contractorName,
        contractorPhone: contractorPhone || null,
        contractorEmail: contractorEmail || null,
        contractorAddress: contractorAddress || null,
        contractorDesc: contractorDesc || null,
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
      message: "ไม่สามารถสร้างผู้รับจ้างได้",
    };
  }
}

/* ====================================================== */
/* UPDATE CONTRACTOR */
/* ====================================================== */
export async function updateContractor(
  id: number,
  data: CreateContractorData,
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

    const contractorName = data.contractorName?.trim();
    const contractorPhone = data.contractorPhone?.trim();
    const contractorEmail = data.contractorEmail?.trim();
    const contractorAddress = data.contractorAddress?.trim();
    const contractorDesc = data.contractorDesc?.trim();

    if (!contractorName) {
      return {
        success: false,
        error: true,
        message: "กรุณากรอกชื่อผู้รับจ้าง",
      };
    }

    /* 🔎 CHECK EXIST */
    const exists = await prisma.contractor.findFirst({
      where: {
        id,
        organizationId,
      },
    });
    if (!exists) {
      return {
        success: false,
        error: true,
        message: "ไม่พบผู้รับจ้างนี้",
      };
    }

    /* 🔎 CHECK DUPLICATE NAME */
    const existsName = await prisma.contractor.findFirst({
      where: {
        organizationId,
        contractorName,
        NOT: { id },
      },
    });
    if (existsName) {
      return {
        success: false,
        error: true,
        message: "ชื่อผู้รับจ้างนี้ถูกใช้แล้ว",
      };
    }
    await prisma.contractor.update({
      where: { id },
      data: {
        contractorName,
        contractorPhone: contractorPhone || null,
        contractorEmail: contractorEmail || null,
        contractorAddress: contractorAddress || null,
        contractorDesc: contractorDesc || null,
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
      message: "ไม่สามารถแก้ไขผู้รับจ้างได้",
    };
  }
}

/* ====================================================== */
/* DELETE CONTRACTOR */
/* ====================================================== */
export async function deleteContractor(
  id: number,
): Promise<ActionState> {
  try {
    await prisma.contractor.update({
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
      message: "ไม่สามารถปิดผู้รับจ้างได้",
    };
  }
}

/* ====================================================== */
/* RESTORE CONTRACTOR */
/* ====================================================== */
export async function restoreContractor(
  id: number,
): Promise<ActionState> {

  try {
    await prisma.contractor.update({
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
      message: "ไม่สามารถเปิดผู้รับจ้างได้",
    };
  }
}