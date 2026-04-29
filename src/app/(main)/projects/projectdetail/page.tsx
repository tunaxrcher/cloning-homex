import { auth } from "@/auth";
import ProjectDetail from "@/components/projects/ProjectDetail";
import { Metadata } from "next";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Projects Detail",
};

const Page = async () => {
  const session = await auth();

  const currentUserId = session?.user?.id ? parseInt(session.user.id) : 0;
  const organizationId = session?.user.organizationId ?? 0;
  const isSpadmin = session?.user?.positionName ?? "";

  const mainTasks = await prisma.task.findMany({
    where: {
      organizationId: organizationId,
      status: { not: "DELETED" },
    },
    orderBy: { id: "desc" },
    select: {
      id: true,
      taskName: true,
      taskDesc: true,
      status: true,
      progressPercent: true,
      coverImageUrl: true,
      estimatedBudget: true,
      estimatedDurationDays: true,
      startPlanned: true,
      finishPlanned: true,
      durationDays: true,
      budget: true,
      startAiPlanned: true,
      startActual: true,
      finishActual: true,
      createdAt: true,
      updatedAt: true,
      projectId: true,
      organizationId: true,
      createdById: true,
      aiMaterialPercent: true,
      aiMaterialCost: true,
      aiLaborPercent: true,
      aiLaborCost: true,
      aiMachineryPercent: true,
      aiMachineryCost: true,
      aiDurationAssumptions: true,
      aiRisks: true,
      aiMaterials: true,
      phase: true,
      aiRefDescription: true,
      aiRefImages: true,
      taskUsers: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      },
      taskContractors: {
        include: {
          contractor: {
            select: {
              id: true,
              contractorName: true,
              contractorPhone: true,
            },
          },
        },
      },
      details: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      procurementTaskLinks: {
        include: {
          procurementItem: {
            select: {
              id: true,
              materialName: true,
              status: true,
              expectedDate: true,
              alertDaysBefore: true,
            },
          },
        },
      },
    },
  });

  const formattedTasks = mainTasks.map((task) => ({
    ...task,
    budget: task.budget ? Number(task.budget) : null,
    estimatedBudget: task.estimatedBudget ? Number(task.estimatedBudget) : null,
    aiMaterialCost: task.aiMaterialCost ? Number(task.aiMaterialCost) : null,
    aiLaborCost: task.aiLaborCost ? Number(task.aiLaborCost) : null,
    aiMachineryCost: task.aiMachineryCost ? Number(task.aiMachineryCost) : null,
    assignees: task.taskUsers?.map((t: any) => t.user) || [],
    contractors: task.taskContractors?.map((tc: any) => tc.contractor) || [],
  }));

  return (
    <ProjectDetail
      organizationId={organizationId}
      currentUserId={currentUserId}
      dataDetail={formattedTasks}
      isSpadmin={isSpadmin}
    />
  );
};

export default Page;
