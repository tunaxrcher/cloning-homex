"use server";

import prisma from "@/lib/prisma";
import { CreateCameraInput, UpdateCameraInput } from "../type";

export async function createCamera(data: CreateCameraInput) {
  try {
    const existingCamera = await prisma.camera.findFirst({
      where: {
        cameraSN: data.cameraSN,
        projectId: data.projectId,
      },
    });

    if (existingCamera) {
      return {
        success: false,
        error: "หมายเลขซีเรียล (SN) นี้ถูกเพิ่มในโปรเจกต์นี้แล้ว",
      };
    }

    const newCamera = await prisma.camera.create({
      data: {
        cameraName: data.cameraName,
        cameraSN: data.cameraSN,
        cameraLocation: data.cameraLocation || "",
        status: data.status,
        organizationId: data.organizationId,
        projectId: data.projectId,
        userId: data.userId,
      },
    });

    return { success: true, error: false, data: newCamera };
  } catch (error: any) {
    console.error("❌ Create Camera Error:", error);
    return {
      success: false,
      error: true,
      data: "ไม่สามารถเพิ่มกล้องได้: " + (error.message || "Unknown error"),
    };
  }
}

export async function updateCamera(dbId: number, data: UpdateCameraInput) {
  try {
    const updated = await prisma.camera.update({
      where: { id: dbId },
      data: {
        cameraName: data.cameraName,
        cameraSN: data.cameraSN,
        cameraLocation: data.cameraLocation,
        status: data.status,
        updatedAt: new Date(),
        ...(data.status ? { updatedAt: new Date() } : {}),
      },
    });

    return { success: true, data: updated };
  } catch (error: any) {
    console.error("❌ Update Camera Error:", error);
    return { success: false, error: "แก้ไขข้อมูลกล้องไม่สำเร็จ" };
  }
}

export async function deleteCamera(dbId: number) {
  try {
    await prisma.camera.delete({
      where: { id: dbId },
    });
    return { success: true };
  } catch (error: any) {
    console.error("❌ Delete Camera Error:", error);
    return {
      success: false,
      error: "ลบข้อมูลกล้องไม่สำเร็จ (อาจมีการผูกข้อมูลอื่นไว้)",
    };
  }
}

export async function getCamerasByProject(projectId: number) {
  try {
    const cameras = await prisma.camera.findMany({
      where: { projectId: projectId },
      orderBy: { id: "desc" },
    });
    return { success: true, data: cameras };
  } catch (error: any) {
    console.error("❌ Get Cameras Error:", error);
    return { success: false, error: "ไม่สามารถดึงข้อมูลกล้องได้", data: [] };
  }
}

export async function savePersonCountAction(
  cameraDBId: number,
  maxCount: number,
) {
  try {
    if (maxCount === 0)
      return { success: true, message: "No people detected, skipped." };

    const camera = await prisma.camera.findFirst({
      where: { id: cameraDBId },
    });

    if (!camera) {
      console.error(`❌ ไม่พบข้อมูลกล้อง ID: ${cameraDBId} ในระบบ`);
      return { success: false, error: "Camera not found" };
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingRecord = await prisma.camera_analytics.findFirst({
      where: {
        cameraId: camera.id,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        personCount: "desc", 
      },
    });

    if (existingRecord) {
      if (maxCount > existingRecord.personCount) {
        await prisma.camera_analytics.update({
          where: { id: existingRecord.id },
          data: { personCount: maxCount },
        });
        // console.log(
        //   `🆙 อัปเดตสถิติใหม่: ${maxCount} คน (เดิม ${existingRecord.personCount})`,
        // );
      } else {
        return {
          success: true,
          message: "New count is not higher than existing record for today.",
        };
      }
    } else {
      await prisma.camera_analytics.create({
        data: {
          cameraId: camera.id,
          personCount: maxCount,
        },
      });
      // console.log(`🆕 บันทึกสถิติแรกของวัน: ${maxCount} คน`);
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Save Analytics Error:", error);
    return { success: false, error: "Failed to save analytics" };
  }
}
