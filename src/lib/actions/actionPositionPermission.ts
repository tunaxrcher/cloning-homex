"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function updatePositionPermission(
  positionId: number,
  permissionId: number,
  allowed: boolean,
) {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);
    if (!organizationId) {
      return { success: false, message: "ไม่พบ organization" };
    }
    await prisma.position_permission.upsert({
      where: {
        positionId_permissionId: {
          positionId,
          permissionId,
        },
      },
      update: {
        allowed,
      },
      create: {
        positionId,
        permissionId,
        allowed,
      },
    });

    return { success: true };
  } catch {
    return {
      success: false,
      message: "ไม่สามารถบันทึกสิทธิได้",
    };
  }
}
