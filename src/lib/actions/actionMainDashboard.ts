"use server";

import prisma from "@/lib/prisma";

export async function getGlobalDashboardData(organizationId: number) {
  try {
    const currentDate = new Date();

    // ยิง Query พร้อมกันเพื่อประสิทธิภาพสูงสุด
    const [
      totalProjects,
      activeProjects,
      planningProjects,
      aggregations,
      delayedProjects,
      projectsForBurnRate,
      urgentProjects,
    ] = await Promise.all([
      prisma.project.count({
        where: { organizationId, status: { not: "DELETED" } },
      }),
      prisma.project.count({
        where: { organizationId, status: "IN_PROGRESS" },
      }),
      prisma.project.count({ where: { organizationId, status: "PLANNING" } }),
      prisma.project.aggregate({
        where: { organizationId, status: { not: "DELETED" } },
        _sum: { budget: true },
        _avg: { progressPercent: true },
      }),
      prisma.project.count({
        where: {
          organizationId,
          status: { notIn: ["DONE", "DELETED"] },
          finishPlanned: { lt: currentDate },
        },
      }),
      // ดึง Top 3 โปรเจกต์ที่มีงบสูงสุดเพื่อมาโชว์ใน Burn Rate
      prisma.project.findMany({
        where: { organizationId, status: { not: "DELETED" } },
        orderBy: { budget: "desc" },
        take: 3,
        select: { projectName: true, budget: true, progressPercent: true },
      }),
      // ดึงโปรเจกต์ที่ใกล้ถึงกำหนดเสร็จ หรือเลยกำหนดไปแล้ว
      prisma.project.findMany({
        where: {
          organizationId,
          status: { notIn: ["DONE", "DELETED"] },
          finishPlanned: { not: null },
        },
        orderBy: { finishPlanned: "asc" },
        take: 4,
        select: { projectName: true, finishPlanned: true },
      }),
    ]);

    // 1. ประกอบร่าง Global Stats
    const totalBudget = Number(aggregations._sum.budget || 0);
    const avgProgress = Math.round(aggregations._avg.progressPercent || 0);
    // สมมติค่าใช้จ่าย = งบรวม x ความคืบหน้าเฉลี่ย (ถ้ามี Table ค่าใช้จ่ายจริงค่อยมาแก้ตรงนี้)
    const totalExpenses = (totalBudget * avgProgress) / 100;

    const globalStats = {
      totalProjects,
      activeProjects,
      planningProjects,
      totalBudget,
      totalExpenses,
      delayedProjects,
      avgProgress,
    };

    // 2. ประกอบร่าง Financial Burn Rate
    const topBurnRateProjects = projectsForBurnRate.map((p) => {
      const budget = Number(p.budget || 0);
      const percent = p.progressPercent || 0;
      const spent = (budget * percent) / 100; // จำลองค่าใช้จ่ายตาม % งาน
      return {
        name: p.projectName,
        spent,
        budget,
        percent,
      };
    });

    // 3. ประกอบร่าง Urgent Milestones
    const urgentMilestones = urgentProjects.map((p) => {
      const diffTime =
        new Date(p.finishPlanned!).getTime() - currentDate.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let type = "primary";
      if (daysLeft < 0) type = "danger";
      else if (daysLeft <= 3) type = "warning";

      return {
        project: p.projectName,
        task: "กำหนดส่งมอบโครงการ", // จำลองชื่อ Task
        daysLeft,
        type,
      };
    });

    return {
      success: true,
      data: { globalStats, topBurnRateProjects, urgentMilestones },
    };
  } catch (error) {
    console.error("❌ Get Global Dashboard Error:", error);
    return { success: false, error: "ดึงข้อมูลล้มเหลว" };
  }
}
