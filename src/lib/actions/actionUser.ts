"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

import {
  ActionState,
  CreateEmployeeData,
  CreateCustomerData,
} from "@/lib/type";

export async function createEmployee(
  _prevState: ActionState,
  data: CreateEmployeeData,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user.organizationId);

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    if (!data.username || !data.password) {
      return {
        success: false,
        error: true,
        message: "กรอก username และ password",
      };
    }

    const hash = await bcrypt.hash(data.password, 10);
    // console.log("CREATE DATA:", data);
    await prisma.user.create({
      data: {
        username: data.username,
        passwordHash: hash,
        displayName: data.displayName ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        note: data.note ?? null,
        avatarUrl:
          data.avatarUrl && data.avatarUrl !== "$undefined"
            ? data.avatarUrl
            : null,
        organizationId,
        positionId: data.positionId,
      },
    });

    return { success: true, error: false };
  } catch (e: any) {
    console.log("ERROR CODE:", e.code);
    console.log("ERROR META:", e.meta);

    // 🔥 ดัก unique username เท่านั้น
    if (
      e.code === "P2002" &&
      e.meta?.target &&
      (Array.isArray(e.meta.target)
        ? e.meta.target.includes("username")
        : String(e.meta.target).includes("username"))
    ) {
      return {
        success: false,
        error: true,
        message: "Username นี้ถูกใช้แล้ว",
      };
    }

    return {
      success: false,
      error: true,
      message: "ไม่สามารถสร้างพนักงานได้",
    };
  }
}

export async function createCustomer(
  _prevState: ActionState,
  data: CreateCustomerData,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = session?.user.organizationId;

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    /* หา position ลูกค้า */
    let customerPosition = await prisma.position.findFirst({
      where: {
        positionName: "ลูกค้า",
        organizationId,
      },
      select: { id: true },
    });

    /* ถ้าไม่มี → สร้างใหม่ */
    if (!customerPosition) {
      const newPosition = await prisma.position.create({
        data: {
          positionName: "ลูกค้า",
          positionDesc: "ตำแหน่งลูกค้า",
          organizationId,
          isActive: true,
        },
        select: { id: true },
      });

      customerPosition = newPosition;
    }

    /* ตรวจ password */
    if (!data.password) {
      throw new Error("Password is required");
    }

    const hash = await bcrypt.hash(data.password, 10);

    /* CREATE USER */
    await prisma.user.create({
      data: {
        username: data.username,
        passwordHash: hash,
        displayName: data.displayName ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        note: data.note ?? null,
        avatarUrl:
          data.avatarUrl && data.avatarUrl !== "$undefined"
            ? data.avatarUrl
            : null,
        organizationId,
        positionId: customerPosition.id,
      },
    });

    return { success: true, error: false };
  } catch (e: any) {
    console.log("ERROR CODE:", e.code);
    console.log("ERROR META:", e.meta);

    /* username ซ้ำ */
    if (
      e.code === "P2002" &&
      (e.meta?.target?.includes("username") ||
        e.meta?.target === "user_username_key")
    ) {
      return {
        success: false,
        error: true,
        message: "Username นี้ถูกใช้แล้ว",
      };
    }
    
    // error อื่น
    return {
      success: false,
      error: true,
      message: "ไม่สามารถสร้างลูกค้าได้",
    };
  }
}

export async function updateCustomer(
  id: number,
  data: CreateCustomerData,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = session?.user.organizationId;

    if (!organizationId) {
      throw new Error("ไม่พบ organization");
    }

    let passwordHash;

    if (data.password && data.password.trim() !== "") {
      passwordHash = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.update({
      where: {
        id,
        organizationId,
      },
      data: {
        username: data.username,
        displayName: data.displayName ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        note: data.note ?? null,
        avatarUrl: data.avatarUrl ?? null,
        ...(passwordHash && { passwordHash }),
      },
    });

    return { success: true, error: false };
  } catch (e: any) {
    // 🔥 ดัก username ซ้ำ
    if (e.code === "P2002") {
      return {
        success: false,
        error: true,
        message: "Username นี้ถูกใช้แล้ว",
      };
    }

    return {
      success: false,
      error: true,
      message: "ไม่สามารถแก้ไขลูกค้าได้",
    };
  }
}

export async function updateEmployee(
  id: number,
  data: any,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = session?.user.organizationId;

    if (!organizationId) {
      throw new Error("ไม่พบ organization");
    }

    let passwordHash: string | undefined;

    if (data.password && data.password.trim() !== "") {
      passwordHash = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.update({
      where: {
        id,
        organizationId, // 🔥 เพิ่มความปลอดภัย
      },
      data: {
        username: data.username,
        displayName: data.displayName ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        note: data.note ?? null,
        positionId: data.positionId,
        avatarUrl: data.avatarUrl ?? null,

        ...(passwordHash && { passwordHash }), // 🔥 แก้ตรงนี้
      },
    });

    return { success: true, error: false };
  } catch (e: any) {
    if (e.code === "P2002") {
      return {
        success: false,
        error: true,
        message: "Username นี้ถูกใช้แล้ว",
      };
    }

    return {
      success: false,
      error: true,
      message: "ไม่สามารถแก้ไขพนักงานได้",
    };
  }
}

export async function deleteEmployee(id: number): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = session?.user.organizationId;

    if (!organizationId) {
      throw new Error("ไม่พบ organization");
    }

    await prisma.user.update({
      where: {
        id,
        organizationId,
      },
      data: {
        isActive: false,
      },
    });

    return { success: true, error: false };
  } catch (e) {
    return {
      success: false,
      error: true,
      message: "ไม่สามารถปิดการใช้งานพนักงานได้",
    };
  }
}

export async function deleteCustomer(id: number): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = session?.user.organizationId;

    if (!organizationId) {
      throw new Error("ไม่พบ organization");
    }

    await prisma.user.update({
      where: {
        id,
        organizationId,
      },
      data: {
        isActive: false,
      },
    });

    return { success: true, error: false };
  } catch (e) {
    return {
      success: false,
      error: true,
      message: "ไม่สามารถปิดการใช้งานลูกค้าได้",
    };
  }
}

export async function restoreEmployee(id: number): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = session?.user.organizationId;

    if (!organizationId) {
      throw new Error("ไม่พบ organization");
    }

    await prisma.user.update({
      where: {
        id,
        organizationId,
      },
      data: {
        isActive: true,
      },
    });

    return { success: true, error: false };
  } catch (e) {
    return {
      success: false,
      error: true,
      message: "ไม่สามารถเปิดใช้งานพนักงานได้",
    };
  }
}

export async function restoreCustomer(id: number): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = session?.user.organizationId;

    if (!organizationId) {
      throw new Error("ไม่พบ organization");
    }

    await prisma.user.update({
      where: {
        id,
        organizationId,
      },
      data: {
        isActive: true,
      },
    });

    return { success: true, error: false };
  } catch (e) {
    return {
      success: false,
      error: true,
      message: "ไม่สามารถเปิดใช้งานลูกค้าได้",
    };
  }
}
