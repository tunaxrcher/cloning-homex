"use server";

import prisma from "@/lib/prisma";
import { deleteFileS3 } from "./actionIndex";

export async function getFloorPlansByProject(
  projectId: number,
  organizationId: number,
) {
  try {
    const floorPlans = await prisma.floorplan.findMany({
      where: {
        projectId: Number(projectId),
        organizationId: Number(organizationId),
      },
      include: {
        points: {
          include: {
            histories: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, error: false, data: floorPlans };
  } catch (error: any) {
    console.error("❌ Error fetching floor plans:", error);
    return {
      success: false,
      error: true,
      data: "ดึงข้อมูลแปลนพื้นล้มเหลว กรุณาลองใหม่อีกครั้ง",
    };
  }
}

export async function createFloorPlan(data: {
  name: string;
  imageUrl: string;
  projectId: number;
  organizationId: number;
  userId: number;
}) {
  try {
    const newFloorPlan = await prisma.floorplan.create({
      data: {
        name: data.name,
        imageUrl: data.imageUrl,
        projectId: data.projectId,
        organizationId: data.organizationId,
        userId: data.userId,
      },
      include: {
        points: true,
      },
    });

    return { success: true, error: false, data: newFloorPlan };
  } catch (error: any) {
    console.error("❌ Create Floor Plan Error:", error);
    return { success: false, error: true, data: "บันทึกแปลนพื้นไม่สำเร็จ" };
  }
}

export async function deleteFloorPlanAction(
  floorPlanId: number,
  imageUrl: string,
  projectId: number,
) {
  try {
    const floorPlan = await prisma.floorplan.findUnique({
      where: { id: floorPlanId },
      include: {
        points: {
          include: {
            histories: true,
          },
        },
      },
    });

    if (!floorPlan) {
      return { success: false, error: "ไม่พบแปลนพื้นนี้ในระบบ" };
    }

    const urlsToDelete: string[] = [];

    if (floorPlan.imageUrl) urlsToDelete.push(floorPlan.imageUrl);
    if (imageUrl && !urlsToDelete.includes(imageUrl))
      urlsToDelete.push(imageUrl);

    floorPlan.points.forEach((point: any) => {
      if (point.thumbnail && !urlsToDelete.includes(point.thumbnail)) {
        urlsToDelete.push(point.thumbnail);
      }

      point.histories.forEach((history: any) => {
        if (history.imageUrl && !urlsToDelete.includes(history.imageUrl)) {
          urlsToDelete.push(history.imageUrl);
        }
      });
    });

    const deletePromises = urlsToDelete.map(async (url: string) => {
      try {
        const urlObj = new URL(url);
        let fileKey = urlObj.pathname.substring(1);

        if (fileKey.startsWith("homex/")) {
          fileKey = fileKey.replace("homex/", "");
        }

        await deleteFileS3(fileKey);
      } catch (s3Error) {
        console.error(`❌ Failed to delete S3 file: ${url}`, s3Error);
      }
    });

    await Promise.all(deletePromises);

    await prisma.floorplan.delete({
      where: { id: floorPlanId },
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ Delete Floor Plan Error:", error);
    return {
      success: false,
      error: "ลบแปลนพื้นไม่สำเร็จ (อาจมีข้อผิดพลาดกับ S3 หรือ DB)",
    };
  }
}

// ==========================================
// 📍 1. ฟังก์ชันสร้างจุด 360
// ==========================================
export async function createPoint360Action(data: {
  title: string;
  location: string;
  thumbnail: string;
  x: number;
  y: number;
  floorPlanId: number;
  organizationId: number;
  projectId: number;
  userId: number;
}) {
  try {
    const newPoint = await prisma.point360.create({
      data: {
        title: data.title,
        location: data.location,
        x: data.x,
        y: data.y,
        floorPlanId: data.floorPlanId,
        histories: {
          create: [
            {
              imageUrl: data.thumbnail,
            },
          ],
        },
        organizationId: data.organizationId,
        projectId: data.projectId,
        userId: data.userId,
      },
      include: {
        histories: true,
      },
    });

    return { success: true, data: newPoint };
  } catch (error: any) {
    console.error("❌ Create Point Error:", error);
    return { success: false, error: "บันทึกจุด 360 ไม่สำเร็จ" };
  }
}

// ==========================================
// 📍 2. ฟังก์ชันลบจุด 360 และลบไฟล์ใน S3
// ==========================================
export async function deletePoint360Action(
  pointId: number,
  thumbnail: string,
  projectId: number,
) {
  try {
    const point = await prisma.point360.findUnique({
      where: { id: pointId },
      include: { histories: true },
    });

    if (!point) {
      return { success: false, error: "ไม่พบจุด 360° นี้ในระบบ" };
    }

    const urlsToDelete = point.histories.map((h: any) => h.imageUrl);
    if (thumbnail && !urlsToDelete.includes(thumbnail)) {
      urlsToDelete.push(thumbnail);
    }

    const deletePromises = urlsToDelete.map(async (url: string) => {
      if (url) {
        try {
          const urlObj = new URL(url);
          let fileKey = urlObj.pathname.substring(1);
          if (fileKey.startsWith("homex/")) {
            fileKey = fileKey.replace("homex/", "");
          }

          await deleteFileS3(fileKey);
        } catch (s3Error) {
          console.error(`❌ Failed to delete S3 file: ${url}`, s3Error);
        }
      }
    });

    await Promise.all(deletePromises);

    await prisma.point360.delete({ where: { id: pointId } });

    return { success: true };
  } catch (error: any) {
    console.error("❌ Delete Point Error:", error);
    return { success: false, error: "ลบจุด 360 ไม่สำเร็จ" };
  }
}

export async function addPointVersion(data: {
  pointId: number;
  imageUrl: string;
  projectId: number;
}) {
  try {
    const newVersion = await prisma.point360history.create({
      data: {
        imageUrl: data.imageUrl,
        pointId: data.pointId,
      },
    });

    return { success: true, data: newVersion };
  } catch (error) {
    return { success: false, error: "เพิ่มเวอร์ชันรูปภาพไม่สำเร็จ" };
  }
}
