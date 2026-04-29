"use server";

import prisma from "@/lib/prisma";

function toDate(d: any) {
  return d instanceof Date ? d : new Date(d);
}

export const calculateTimeline = async (tasks: any[], projectStart: string) => {
  const map = new Map<number, any>();

  tasks.forEach((t) => {
    map.set(t.id, { ...t });
  });

  const sorted = [...tasks].sort((a, b) => a.orderAi - b.orderAi);

  sorted.forEach((task) => {
    let start = new Date(projectStart);

    if (task.dependsOn && task.dependsOn.length > 0) {
      task.dependsOn.forEach((dId: number) => {
        const dep = map.get(dId);
        if (!dep || !dep.start) return;

        const end = new Date(dep.start);
        end.setDate(end.getDate() + (dep.estimatedDurationDays || 1) - 1);

        if (end > start) start = end;
      });
    } else {
      const samePhaseTasks = sorted.filter(
        (t) => t.phaseAi === task.phaseAi && t.orderAi < task.orderAi,
      );

      if (samePhaseTasks.length > 0) {
        const prev = samePhaseTasks[samePhaseTasks.length - 1];
        const prevData = map.get(prev.id);

        if (prevData?.start) {
          const prevEnd = new Date(prevData.start);
          prevEnd.setDate(
            prevEnd.getDate() + (prev.estimatedDurationDays || 1) - 1,
          );

          start = prevEnd;
        }
      }
    }
    map.get(task.id).start = start.toISOString().split("T")[0];
  });

  return Array.from(map.values());
};

export async function getPlanningData(projectId: number) {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        isPlanned: true,
        status: { not: "DELETED" },
      },
      include: {
        dependencies: true,
        taskContractors: {
          include: {
            contractor: true,
          },
        },
      },
    });

    if (!tasks.length) {
      return { success: true, data: [] };
    }
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { startPlanned: true },
    });
    const projectStart = project?.startPlanned
      ? new Date(project.startPlanned)
      : new Date();

    if (!project?.startPlanned) {
      console.warn("⚠️ projectStart is null, using now()");
    }
    const tasksWithDeps = tasks.map((t) => ({
      ...t,
      dependsOn: t.dependencies.map((d: any) => d.dependsOnId),
    }));
    const withTimeline = await calculateTimeline(
      tasksWithDeps,
      projectStart.toISOString().split("T")[0],
    );
    const mapped = withTimeline.map((t) => {
      const start = toDate(t.start);
      const diffDays =
        (start.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
      return {
        id: t.id,
        name: t.taskName || "ไม่มีชื่อ",
        progress: t.progressPercent || 0,
        startDay: diffDays,
        durationDay: Math.max(1, t.estimatedDurationDays || 1),
        phase: t.phaseAi || "ไม่มี Phase",
        order: t.orderAi || 0,
        startDate: start,
        taskContractors: t.taskContractors,
      };
    });
    mapped.sort(
      (a, b) =>
        (a.order ?? 0) - (b.order ?? 0) ||
        (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0),
    );
    const grouped: Record<string, any[]> = {};
    mapped.forEach((t) => {
      if (!grouped[t.phase]) grouped[t.phase] = [];
      grouped[t.phase].push(t);
    });

    const colors = ["bg-emerald-500", "bg-blue-500", "bg-purple-500"];
    const ganttData = Object.keys(grouped).map((phase, i) => ({
      id: `phase-${i}`,
      title: phase,
      color: colors[i % colors.length],
      tasks: grouped[phase],
    }));
    return {
      success: true,
      data: ganttData,
    };
  } catch (error) {
    console.error("Planning Error:", error);
    return {
      success: false,
      data: [],
    };
  }
}

export async function getPlanningTasksForAI(projectId: number) {
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      status: { not: "DELETED" },
    },
    select: {
      id: true,
      taskName: true,
      estimatedDurationDays: true,
    },
  });

  return tasks.map((t) => ({
    id: t.id,
    name: t.taskName,
    estimatedDurationDays: t.estimatedDurationDays,
  }));
}

export async function getProjectStart(projectId: number) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { startPlanned: true },
  });

  return project?.startPlanned ?? null;
}

export async function updatePlanningFromAI(aiData: any[]) {
  try {
    await prisma.$transaction(async (tx) => {
      for (const item of aiData) {
        await tx.task.update({
          where: { id: item.id },
          data: {
            orderAi: item.orderAi,
            phaseAi: item.phaseAi,
            estimatedDurationDays: item.estimatedDurationDays,
            isPlanned: true,
          },
        });
        await tx.task_dependency.deleteMany({
          where: { taskId: item.id },
        });
        if (item.dependsOn?.length) {
          await tx.task_dependency.createMany({
            data: item.dependsOn.map((depId: number) => ({
              taskId: item.id,
              dependsOnId: depId,
            })),
          });
        }
      }
    });
    return { success: true };
  } catch (error) {
    console.error("UPDATE AI ERROR:", error);
    return { success: false, error: String(error) };
  }
}
