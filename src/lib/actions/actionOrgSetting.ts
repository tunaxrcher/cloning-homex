"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ActionState } from "@/lib/type";

/* ====================================================== */
/* GET SETTING                                             */
/* ====================================================== */
export async function getOrgSetting(
  key: string,
): Promise<string | null> {
  const session = await auth();
  const organizationId = Number(session?.user?.organizationId);
  if (!organizationId) return null;

  const setting = await prisma.organization_setting.findUnique({
    where: {
      organizationId_settingKey: {
        organizationId,
        settingKey: key,
      },
    },
  });

  return setting?.settingValue ?? null;
}

/* ====================================================== */
/* GET MULTIPLE SETTINGS                                   */
/* ====================================================== */
export async function getOrgSettings(
  keys: string[],
): Promise<Record<string, string>> {
  const session = await auth();
  const organizationId = Number(session?.user?.organizationId);
  if (!organizationId) return {};

  const settings = await prisma.organization_setting.findMany({
    where: {
      organizationId,
      settingKey: { in: keys },
    },
  });

  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.settingKey] = s.settingValue;
  }
  return result;
}

/* ====================================================== */
/* UPSERT SETTING                                          */
/* ====================================================== */
export async function upsertOrgSetting(
  key: string,
  value: string,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);
    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    await prisma.organization_setting.upsert({
      where: {
        organizationId_settingKey: {
          organizationId,
          settingKey: key,
        },
      },
      update: {
        settingValue: value,
        updatedAt: new Date(),
      },
      create: {
        organizationId,
        settingKey: key,
        settingValue: value,
      },
    });

    return { success: true, error: false, message: "บันทึกสำเร็จ" };
  } catch (e) {
    console.error("upsertOrgSetting error:", e);
    return { success: false, error: true, message: "บันทึกไม่สำเร็จ" };
  }
}
