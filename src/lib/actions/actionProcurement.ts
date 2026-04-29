"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import {
  ActionState,
  CreateProcurementItemData,
  UpdateProcurementItemData,
  CreateSupplierQuoteData,
} from "@/lib/type";

/* ====================================================== */
/* FETCH PROCUREMENT ITEMS (by project)                   */
/* ====================================================== */

export async function getProcurementItems(projectId: number) {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);
    if (!organizationId) return [];

    const items = await prisma.procurement_item.findMany({
      where: { projectId, organizationId },
      orderBy: { sortOrder: "asc" },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        quotes: {
          include: {
            supplier: {
              select: { id: true, supplierName: true, contactPerson: true },
            },
          },
        },
        taskLinks: {
          include: {
            task: {
              select: { id: true, taskName: true, status: true, startPlanned: true },
            },
          },
        },
      },
    });

    return items.map((item: any) => ({
      ...item,
      quantity: item.quantity ? Number(item.quantity) : null,
      aiEstimateMin: item.aiEstimateMin ? Number(item.aiEstimateMin) : null,
      aiEstimateMid: item.aiEstimateMid ? Number(item.aiEstimateMid) : null,
      aiEstimateMax: item.aiEstimateMax ? Number(item.aiEstimateMax) : null,
      expectedDate: item.expectedDate ? item.expectedDate.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      quotes: item.quotes.map((q: any) => ({
        ...q,
        unitPrice: q.unitPrice ? Number(q.unitPrice) : null,
        totalPrice: q.totalPrice ? Number(q.totalPrice) : null,
        quoteDate: q.quoteDate ? q.quoteDate.toISOString() : null,
        validUntil: q.validUntil ? q.validUntil.toISOString() : null,
      })),
      taskLinks: item.taskLinks.map((tl: any) => ({
        ...tl,
        confirmedAt: tl.confirmedAt ? tl.confirmedAt.toISOString() : null,
        task: {
          ...tl.task,
          startPlanned: tl.task.startPlanned ? tl.task.startPlanned.toISOString() : null,
        },
      })),
    }));
  } catch (error) {
    console.error("getProcurementItems error:", error);
    return [];
  }
}

/* ====================================================== */
/* CREATE PROCUREMENT ITEM                                */
/* ====================================================== */

export async function createProcurementItem(
  data: CreateProcurementItemData,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);
    const userId = Number(session?.user?.id);

    if (!organizationId || !userId) {
      return { success: false, error: true, message: "ไม่พบข้อมูลผู้ใช้" };
    }

    const materialName = data.materialName?.trim();
    if (!materialName) {
      return { success: false, error: true, message: "กรุณากรอกชื่อวัสดุ" };
    }

    const item = await prisma.procurement_item.create({
      data: {
        materialName,
        specification: data.specification?.trim() || null,
        partType: data.partType || "OTHER",
        materialGroup: data.materialGroup || "GENERAL",
        unit: data.unit?.trim() || null,
        quantity: data.quantity ?? null,
        status: data.status || "PENDING",
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        leadTimeDays: data.leadTimeDays ?? null,
        alertEnabled: data.alertEnabled ?? false,
        alertDaysBefore: data.alertDaysBefore ?? 3,
        note: data.note?.trim() || null,
        sortOrder: data.sortOrder ?? 0,
        projectId: data.projectId,
        organizationId,
        createdById: userId,
      },
    });

    await prisma.procurement_history.create({
      data: {
        procurementItemId: item.id,
        action: "CREATED",
        newValue: JSON.stringify({ materialName, quantity: data.quantity }),
        changedByUserId: userId,
      },
    });

    return { success: true, error: false, data: { id: item.id } };
  } catch (error) {
    console.error("createProcurementItem error:", error);
    return { success: false, error: true, message: "ไม่สามารถสร้างรายการวัสดุได้" };
  }
}

/* ====================================================== */
/* CREATE MANY PROCUREMENT ITEMS (batch from AI)          */
/* ====================================================== */

export async function createManyProcurementItems(
  items: CreateProcurementItemData[],
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);
    const userId = Number(session?.user?.id);

    if (!organizationId || !userId) {
      return { success: false, error: true, message: "ไม่พบข้อมูลผู้ใช้" };
    }

    if (!items.length) {
      return { success: false, error: true, message: "ไม่มีรายการที่จะบันทึก" };
    }

    await prisma.procurement_item.createMany({
      data: items.map((item, idx) => ({
        materialName: item.materialName?.trim() || "วัสดุไม่มีชื่อ",
        specification: item.specification?.trim() || null,
        partType: item.partType || "OTHER",
        materialGroup: item.materialGroup || "GENERAL",
        unit: item.unit?.trim() || null,
        quantity: item.quantity ?? null,
        status: "PENDING",
        expectedDate: item.expectedDate ? new Date(item.expectedDate) : null,
        leadTimeDays: item.leadTimeDays ?? null,
        note: item.note?.trim() || null,
        sortOrder: item.sortOrder ?? idx,
        projectId: item.projectId,
        organizationId,
        createdById: userId,
      })),
    });

    return { success: true, error: false };
  } catch (error) {
    console.error("createManyProcurementItems error:", error);
    return { success: false, error: true, message: "ไม่สามารถบันทึกรายการได้" };
  }
}

/* ====================================================== */
/* CREATE PROCUREMENT ITEM WITH RELATIONS (transaction)   */
/* ====================================================== */

interface CreateItemWithRelationsInput {
  item: CreateProcurementItemData;
  quotes: Omit<CreateSupplierQuoteData, "procurementItemId">[];
  taskIds: number[];
}

export async function createProcurementItemWithRelations(
  input: CreateItemWithRelationsInput,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);
    const userId = Number(session?.user?.id);

    if (!organizationId || !userId) {
      return { success: false, error: true, message: "ไม่พบข้อมูลผู้ใช้" };
    }

    const materialName = input.item.materialName?.trim();
    if (!materialName) {
      return { success: false, error: true, message: "กรุณากรอกชื่อวัสดุ" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.procurement_item.create({
        data: {
          materialName,
          specification: input.item.specification?.trim() || null,
          partType: input.item.partType || "OTHER",
          materialGroup: input.item.materialGroup || "GENERAL",
          unit: input.item.unit?.trim() || null,
          quantity: input.item.quantity ?? null,
          status: input.item.status || "PENDING",
          expectedDate: input.item.expectedDate ? new Date(input.item.expectedDate) : null,
          leadTimeDays: input.item.leadTimeDays ?? null,
          alertEnabled: input.item.alertEnabled ?? false,
          alertDaysBefore: input.item.alertDaysBefore ?? 3,
          note: input.item.note?.trim() || null,
          sortOrder: input.item.sortOrder ?? 0,
          projectId: input.item.projectId,
          organizationId,
          createdById: userId,
        },
      });

      await tx.procurement_history.create({
        data: {
          procurementItemId: item.id,
          action: "CREATED",
          newValue: JSON.stringify({ materialName, quantity: input.item.quantity }),
          changedByUserId: userId,
        },
      });

      if (input.quotes.length > 0) {
        await tx.procurement_supplier_quote.createMany({
          data: input.quotes.map((q) => ({
            procurementItemId: item.id,
            supplierId: q.supplierId,
            unitPrice: q.unitPrice ?? null,
            totalPrice: q.totalPrice ?? null,
            quoteDate: q.quoteDate ? new Date(q.quoteDate) : null,
            validUntil: q.validUntil ? new Date(q.validUntil) : null,
            note: q.note?.trim() || null,
            fileUrl: q.fileUrl || null,
            isSelected: q.isSelected ?? false,
          })),
        });
      }

      if (input.taskIds.length > 0) {
        await tx.procurement_task_link.createMany({
          data: input.taskIds.map((taskId) => ({
            procurementItemId: item.id,
            taskId,
            linkedBy: "MANUAL",
            confirmedByUserId: userId,
            confirmedAt: new Date(),
          })),
        });
      }

      return item;
    });

    return { success: true, error: false, data: { id: result.id } };
  } catch (error) {
    console.error("createProcurementItemWithRelations error:", error);
    return { success: false, error: true, message: "ไม่สามารถสร้างรายการวัสดุได้" };
  }
}

/* ====================================================== */
/* UPDATE PROCUREMENT ITEM                                */
/* ====================================================== */

export async function updateProcurementItem(
  id: number,
  data: UpdateProcurementItemData,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    const exists = await prisma.procurement_item.findFirst({
      where: { id, organizationId },
    });

    if (!exists) {
      return { success: false, error: true, message: "ไม่พบรายการวัสดุนี้" };
    }

    await prisma.procurement_item.update({
      where: { id },
      data: {
        ...(data.materialName !== undefined && { materialName: data.materialName.trim() }),
        ...(data.specification !== undefined && { specification: data.specification.trim() || null }),
        ...(data.partType !== undefined && { partType: data.partType }),
        ...(data.materialGroup !== undefined && { materialGroup: data.materialGroup }),
        ...(data.unit !== undefined && { unit: data.unit.trim() || null }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.expectedDate !== undefined && {
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        }),
        ...(data.leadTimeDays !== undefined && { leadTimeDays: data.leadTimeDays }),
        ...(data.alertEnabled !== undefined && { alertEnabled: data.alertEnabled }),
        ...(data.alertDaysBefore !== undefined && { alertDaysBefore: data.alertDaysBefore }),
        ...(data.note !== undefined && { note: data.note.trim() || null }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    return { success: true, error: false };
  } catch (error) {
    console.error("updateProcurementItem error:", error);
    return { success: false, error: true, message: "ไม่สามารถแก้ไขรายการได้" };
  }
}

/* ====================================================== */
/* UPDATE PROCUREMENT ITEM STATUS                         */
/* ====================================================== */

export async function updateProcurementStatus(
  id: number,
  status: string,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);
    const userId = Number(session?.user?.id);

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    const item = await prisma.procurement_item.findFirst({
      where: { id, organizationId },
    });

    if (!item) {
      return { success: false, error: true, message: "ไม่พบรายการวัสดุนี้" };
    }

    const oldStatus = item.status;

    await prisma.$transaction([
      prisma.procurement_item.update({
        where: { id },
        data: { status },
      }),
      prisma.procurement_history.create({
        data: {
          procurementItemId: id,
          action: "STATUS_CHANGED",
          oldValue: JSON.stringify({ status: oldStatus }),
          newValue: JSON.stringify({ status }),
          changedByUserId: userId,
        },
      }),
    ]);

    return { success: true, error: false };
  } catch (error) {
    console.error("updateProcurementStatus error:", error);
    return { success: false, error: true, message: "ไม่สามารถเปลี่ยนสถานะได้" };
  }
}

/* ====================================================== */
/* UPDATE AI PRICE ESTIMATES                              */
/* ====================================================== */

export async function updateAiEstimates(
  id: number,
  priceMin: number,
  priceMid: number,
  priceMax: number,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    const exists = await prisma.procurement_item.findFirst({
      where: { id, organizationId },
    });

    if (!exists) {
      return { success: false, error: true, message: "ไม่พบรายการวัสดุนี้" };
    }

    await prisma.procurement_item.update({
      where: { id },
      data: {
        aiEstimateMin: priceMin,
        aiEstimateMid: priceMid,
        aiEstimateMax: priceMax,
      },
    });

    return { success: true, error: false };
  } catch (error) {
    console.error("updateAiEstimates error:", error);
    return { success: false, error: true, message: "ไม่สามารถบันทึกราคาประเมินได้" };
  }
}

/* ====================================================== */
/* PROCUREMENT ITEM IMAGE — ADD                           */
/* ====================================================== */

export async function addProcurementItemImage(
  procurementItemId: number,
  imageUrl: string,
  caption?: string,
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    // Get current max sortOrder
    const lastImg = await prisma.procurement_item_image.findFirst({
      where: { procurementItemId },
      orderBy: { sortOrder: "desc" },
    });
    const nextSort = (lastImg?.sortOrder ?? -1) + 1;

    await prisma.procurement_item_image.create({
      data: {
        procurementItemId,
        imageUrl,
        caption: caption?.trim() || null,
        sortOrder: nextSort,
      },
    });

    return { success: true, error: false };
  } catch (error) {
    console.error("addProcurementItemImage error:", error);
    return { success: false, error: true, message: "ไม่สามารถเพิ่มรูปได้" };
  }
}

/* ====================================================== */
/* PROCUREMENT ITEM IMAGE — DELETE                        */
/* ====================================================== */

export async function deleteProcurementItemImage(
  imageId: number,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    const image = await prisma.procurement_item_image.findFirst({
      where: { id: imageId },
      include: { procurementItem: { select: { organizationId: true } } },
    });

    if (!image || image.procurementItem.organizationId !== organizationId) {
      return { success: false, error: true, message: "ไม่พบรูปนี้" };
    }

    await prisma.procurement_item_image.delete({ where: { id: imageId } });
    return { success: true, error: false };
  } catch (error) {
    console.error("deleteProcurementItemImage error:", error);
    return { success: false, error: true, message: "ไม่สามารถลบรูปได้" };
  }
}

/* ====================================================== */
/* DELETE PROCUREMENT ITEM                                */
/* ====================================================== */

export async function deleteProcurementItem(
  id: number,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    const exists = await prisma.procurement_item.findFirst({
      where: { id, organizationId },
    });

    if (!exists) {
      return { success: false, error: true, message: "ไม่พบรายการวัสดุนี้" };
    }

    await prisma.procurement_item.delete({ where: { id } });

    return { success: true, error: false, message: exists.materialName };
  } catch (error) {
    console.error("deleteProcurementItem error:", error);
    return { success: false, error: true, message: "ไม่สามารถลบรายการได้" };
  }
}

/* ====================================================== */
/* SUPPLIER QUOTE — CREATE                                */
/* ====================================================== */

export async function createSupplierQuote(
  data: CreateSupplierQuoteData,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    await prisma.procurement_supplier_quote.create({
      data: {
        procurementItemId: data.procurementItemId,
        supplierId: data.supplierId,
        unitPrice: data.unitPrice ?? null,
        totalPrice: data.totalPrice ?? null,
        quoteDate: data.quoteDate ? new Date(data.quoteDate) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        note: data.note?.trim() || null,
        fileUrl: data.fileUrl || null,
        isSelected: data.isSelected ?? false,
      },
    });

    return { success: true, error: false };
  } catch (error) {
    console.error("createSupplierQuote error:", error);
    return { success: false, error: true, message: "ไม่สามารถบันทึกใบเสนอราคาได้" };
  }
}

/* ====================================================== */
/* SUPPLIER QUOTE — UPDATE                                */
/* ====================================================== */

export async function updateSupplierQuote(
  id: number,
  data: Partial<CreateSupplierQuoteData>,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    const quote = await prisma.procurement_supplier_quote.findFirst({
      where: { id },
      include: { procurementItem: { select: { organizationId: true } } },
    });

    if (!quote || quote.procurementItem.organizationId !== organizationId) {
      return { success: false, error: true, message: "ไม่พบใบเสนอราคานี้" };
    }

    await prisma.procurement_supplier_quote.update({
      where: { id },
      data: {
        ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
        ...(data.totalPrice !== undefined && { totalPrice: data.totalPrice }),
        ...(data.quoteDate !== undefined && {
          quoteDate: data.quoteDate ? new Date(data.quoteDate) : null,
        }),
        ...(data.validUntil !== undefined && {
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
        }),
        ...(data.note !== undefined && { note: data.note?.trim() || null }),
        ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl || null }),
        ...(data.isSelected !== undefined && { isSelected: data.isSelected }),
      },
    });

    return { success: true, error: false };
  } catch (error) {
    console.error("updateSupplierQuote error:", error);
    return { success: false, error: true, message: "ไม่สามารถแก้ไขใบเสนอราคาได้" };
  }
}

/* ====================================================== */
/* SUPPLIER QUOTE — DELETE                                */
/* ====================================================== */

export async function deleteSupplierQuote(
  id: number,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    const quote = await prisma.procurement_supplier_quote.findFirst({
      where: { id },
      include: { procurementItem: { select: { organizationId: true } } },
    });

    if (!quote || quote.procurementItem.organizationId !== organizationId) {
      return { success: false, error: true, message: "ไม่พบใบเสนอราคานี้" };
    }

    await prisma.procurement_supplier_quote.delete({ where: { id } });
    return { success: true, error: false };
  } catch (error) {
    console.error("deleteSupplierQuote error:", error);
    return { success: false, error: true, message: "ไม่สามารถลบใบเสนอราคาได้" };
  }
}

/* ====================================================== */
/* SUPPLIER QUOTE — SELECT (transactional toggle)         */
/* ====================================================== */

export async function selectSupplierQuote(
  procurementItemId: number,
  quoteId: number,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    const item = await prisma.procurement_item.findFirst({
      where: { id: procurementItemId, organizationId },
    });

    if (!item) {
      return { success: false, error: true, message: "ไม่พบรายการวัสดุนี้" };
    }

    await prisma.$transaction([
      prisma.procurement_supplier_quote.updateMany({
        where: { procurementItemId, isSelected: true },
        data: { isSelected: false },
      }),
      prisma.procurement_supplier_quote.update({
        where: { id: quoteId },
        data: { isSelected: true },
      }),
    ]);

    return { success: true, error: false };
  } catch (error) {
    console.error("selectSupplierQuote error:", error);
    return { success: false, error: true, message: "ไม่สามารถเลือก Supplier ได้" };
  }
}

/* ====================================================== */
/* TASK LINK — CREATE                                     */
/* ====================================================== */

export async function linkProcurementTask(
  procurementItemId: number,
  taskId: number,
  linkedBy: string = "MANUAL",
  aiConfidence?: number,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);
    const userId = Number(session?.user?.id);

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    const item = await prisma.procurement_item.findFirst({
      where: { id: procurementItemId, organizationId },
    });

    if (!item) {
      return { success: false, error: true, message: "ไม่พบรายการวัสดุนี้" };
    }

    await prisma.procurement_task_link.create({
      data: {
        procurementItemId,
        taskId,
        linkedBy,
        aiConfidence: aiConfidence ?? null,
        confirmedByUserId: linkedBy === "MANUAL" ? userId : null,
        confirmedAt: linkedBy === "MANUAL" ? new Date() : null,
      },
    });

    return { success: true, error: false };
  } catch (error) {
    console.error("linkProcurementTask error:", error);
    return { success: false, error: true, message: "ไม่สามารถผูก Task ได้" };
  }
}

/* ====================================================== */
/* TASK LINK — CONFIRM (AI suggestion → user confirms)    */
/* ====================================================== */

export async function confirmProcurementTaskLink(
  linkId: number,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);
    const userId = Number(session?.user?.id);

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    const link = await prisma.procurement_task_link.findFirst({
      where: { id: linkId },
      include: { procurementItem: { select: { organizationId: true } } },
    });

    if (!link || link.procurementItem.organizationId !== organizationId) {
      return { success: false, error: true, message: "ไม่พบ Task link นี้" };
    }

    await prisma.procurement_task_link.update({
      where: { id: linkId },
      data: {
        confirmedByUserId: userId,
        confirmedAt: new Date(),
      },
    });

    return { success: true, error: false };
  } catch (error) {
    console.error("confirmProcurementTaskLink error:", error);
    return { success: false, error: true, message: "ไม่สามารถยืนยันได้" };
  }
}

/* ====================================================== */
/* TASK LINK — SYNC (diff-based batch update)             */
/* ====================================================== */

interface SyncTaskLinkEntry {
  taskId: number;
  linkedBy?: string;
  aiConfidence?: number;
}

export async function syncProcurementTaskLinks(
  procurementItemId: number,
  desiredTasks: SyncTaskLinkEntry[],
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);
    const userId = Number(session?.user?.id);

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    const item = await prisma.procurement_item.findFirst({
      where: { id: procurementItemId, organizationId },
      include: { taskLinks: { select: { id: true, taskId: true } } },
    });

    if (!item) {
      return { success: false, error: true, message: "ไม่พบรายการวัสดุนี้" };
    }

    const currentTaskIds = new Set(item.taskLinks.map((tl) => tl.taskId));
    const desiredTaskIds = new Set(desiredTasks.map((t) => t.taskId));

    const toRemove = item.taskLinks.filter((tl) => !desiredTaskIds.has(tl.taskId));
    const toAdd = desiredTasks.filter((t) => !currentTaskIds.has(t.taskId));

    if (toRemove.length === 0 && toAdd.length === 0) {
      return { success: true, error: false };
    }

    await prisma.$transaction(async (tx) => {
      if (toRemove.length > 0) {
        await tx.procurement_task_link.deleteMany({
          where: { id: { in: toRemove.map((tl) => tl.id) } },
        });
      }

      if (toAdd.length > 0) {
        await tx.procurement_task_link.createMany({
          data: toAdd.map((t) => ({
            procurementItemId,
            taskId: t.taskId,
            linkedBy: t.linkedBy || "MANUAL",
            aiConfidence: t.aiConfidence ?? null,
            confirmedByUserId: (t.linkedBy || "MANUAL") === "MANUAL" ? userId : null,
            confirmedAt: (t.linkedBy || "MANUAL") === "MANUAL" ? new Date() : null,
          })),
        });
      }
    });

    return { success: true, error: false };
  } catch (error) {
    console.error("syncProcurementTaskLinks error:", error);
    return { success: false, error: true, message: "ไม่สามารถอัปเดต Task links ได้" };
  }
}

/* ====================================================== */
/* TASK LINK — DELETE                                     */
/* ====================================================== */

export async function unlinkProcurementTask(
  linkId: number,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    const link = await prisma.procurement_task_link.findFirst({
      where: { id: linkId },
      include: { procurementItem: { select: { organizationId: true } } },
    });

    if (!link || link.procurementItem.organizationId !== organizationId) {
      return { success: false, error: true, message: "ไม่พบ Task link นี้" };
    }

    await prisma.procurement_task_link.delete({ where: { id: linkId } });
    return { success: true, error: false };
  } catch (error) {
    console.error("unlinkProcurementTask error:", error);
    return { success: false, error: true, message: "ไม่สามารถยกเลิกการผูก Task ได้" };
  }
}

/* ====================================================== */
/* PURCHASE ORDER — GENERATE                              */
/* ====================================================== */

export async function generatePurchaseOrder(
  projectId: number,
  supplierId: number,
  itemIds: number[],
  note?: string,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);
    const userId = Number(session?.user?.id);

    if (!organizationId || !userId) {
      return { success: false, error: true, message: "ไม่พบข้อมูลผู้ใช้" };
    }

    if (!itemIds.length) {
      return { success: false, error: true, message: "กรุณาเลือกรายการวัสดุ" };
    }

    // Generate PO number: PO-YYYY-NNN
    const year = new Date().getFullYear();
    const lastPo = await prisma.purchase_order.findFirst({
      where: { poNumber: { startsWith: `PO-${year}-` } },
      orderBy: { poNumber: "desc" },
    });

    let nextNum = 1;
    if (lastPo) {
      const parts = lastPo.poNumber.split("-");
      nextNum = (parseInt(parts[2]) || 0) + 1;
    }
    const poNumber = `PO-${year}-${String(nextNum).padStart(3, "0")}`;

    // Get selected quotes + procurement items for quantity
    const [quotes, procurementItems] = await Promise.all([
      prisma.procurement_supplier_quote.findMany({
        where: {
          procurementItemId: { in: itemIds },
          supplierId,
          isSelected: true,
        },
      }),
      prisma.procurement_item.findMany({
        where: { id: { in: itemIds }, organizationId },
        select: { id: true, quantity: true },
      }),
    ]);

    const quoteMap = new Map<number, any>(
      quotes.map((q: any) => [q.procurementItemId, q]),
    );
    const itemMap = new Map<number, any>(
      procurementItems.map((i: any) => [i.id, i]),
    );

    // Calculate total
    let totalAmount = 0;
    const poItemsData = itemIds.map((itemId) => {
      const quote = quoteMap.get(itemId);
      const item = itemMap.get(itemId);
      const unitPrice = quote ? Number(quote.unitPrice) || 0 : 0;
      const totalPrice = quote ? Number(quote.totalPrice) || 0 : 0;
      const quantity = item?.quantity ? Number(item.quantity) : null;
      totalAmount += totalPrice;
      return {
        procurementItemId: itemId,
        quantity,
        unitPrice: unitPrice || null,
        totalPrice: totalPrice || null,
      };
    });

    const po = await prisma.purchase_order.create({
      data: {
        poNumber,
        status: "DRAFT",
        totalAmount: totalAmount || null,
        note: note?.trim() || null,
        organizationId,
        projectId,
        supplierId,
        createdById: userId,
        items: {
          create: poItemsData,
        },
      },
    });

    // Log history for each item
    await prisma.procurement_history.createMany({
      data: itemIds.map((itemId) => ({
        procurementItemId: itemId,
        action: "PO_GENERATED",
        newValue: JSON.stringify({ poNumber, poId: po.id }),
        changedByUserId: userId,
      })),
    });

    return { success: true, error: false, message: poNumber };
  } catch (error) {
    console.error("generatePurchaseOrder error:", error);
    return { success: false, error: true, message: "ไม่สามารถสร้างใบสั่งซื้อได้" };
  }
}

/* ====================================================== */
/* PURCHASE ORDER — LIST                                  */
/* ====================================================== */

export async function getPurchaseOrders(projectId: number) {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);
    if (!organizationId) return [];

    const orders = await prisma.purchase_order.findMany({
      where: { projectId, organizationId },
      orderBy: { createdAt: "desc" },
      include: {
        supplier: { select: { id: true, supplierName: true } },
        creator: { select: { id: true, displayName: true } },
        items: {
          include: {
            procurementItem: {
              select: { id: true, materialName: true, unit: true, quantity: true },
            },
          },
        },
      },
    });

    return orders.map((o: any) => ({
      ...o,
      totalAmount: o.totalAmount ? Number(o.totalAmount) : null,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      items: o.items.map((item: any) => ({
        ...item,
        quantity: item.quantity ? Number(item.quantity) : null,
        unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        totalPrice: item.totalPrice ? Number(item.totalPrice) : null,
        procurementItem: {
          ...item.procurementItem,
          quantity: item.procurementItem.quantity
            ? Number(item.procurementItem.quantity)
            : null,
        },
      })),
    }));
  } catch (error) {
    console.error("getPurchaseOrders error:", error);
    return [];
  }
}

/* ====================================================== */
/* PURCHASE ORDER — UPDATE STATUS                         */
/* ====================================================== */

export async function updatePurchaseOrderStatus(
  poId: number,
  status: string,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);
    const userId = Number(session?.user?.id);

    if (!organizationId || !userId) {
      return { success: false, error: true, message: "ไม่พบข้อมูลผู้ใช้" };
    }

    const po = await prisma.purchase_order.findFirst({
      where: { id: poId, organizationId },
    });

    if (!po) {
      return { success: false, error: true, message: "ไม่พบใบสั่งซื้อนี้" };
    }

    await prisma.purchase_order.update({
      where: { id: poId },
      data: { status },
    });

    return { success: true, error: false };
  } catch (error) {
    console.error("updatePurchaseOrderStatus error:", error);
    return { success: false, error: true, message: "ไม่สามารถเปลี่ยนสถานะ PO ได้" };
  }
}

/* ====================================================== */
/* PURCHASE ORDER — DELETE (DRAFT only)                   */
/* ====================================================== */

export async function deletePurchaseOrder(
  poId: number,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user?.organizationId);

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    const po = await prisma.purchase_order.findFirst({
      where: { id: poId, organizationId },
    });

    if (!po) {
      return { success: false, error: true, message: "ไม่พบใบสั่งซื้อนี้" };
    }

    if (po.status !== "DRAFT") {
      return { success: false, error: true, message: "ลบได้เฉพาะ PO ที่เป็นแบบร่างเท่านั้น" };
    }

    await prisma.purchase_order.delete({ where: { id: poId } });

    return { success: true, error: false };
  } catch (error) {
    console.error("deletePurchaseOrder error:", error);
    return { success: false, error: true, message: "ไม่สามารถลบใบสั่งซื้อได้" };
  }
}

/* ====================================================== */
/* PROCUREMENT HISTORY — GET                              */
/* ====================================================== */

export async function getProcurementHistory(itemId: number) {
  try {
    const histories = await prisma.procurement_history.findMany({
      where: { procurementItemId: itemId },
      orderBy: { changedAt: "desc" },
      include: {
        changedByUser: {
          select: { id: true, displayName: true },
        },
      },
    });

    return histories.map((h: any) => ({
      ...h,
      changedAt: h.changedAt.toISOString(),
    }));
  } catch (error) {
    console.error("getProcurementHistory error:", error);
    return [];
  }
}
