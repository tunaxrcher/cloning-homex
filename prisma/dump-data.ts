import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tables = [
    { name: "organization", query: () => prisma.organization.findMany() },
    { name: "user", query: () => prisma.user.findMany() },
    { name: "position", query: () => prisma.position.findMany() },
    { name: "permission", query: () => prisma.permission.findMany() },
    {
      name: "position_permission",
      query: () => prisma.position_permission.findMany(),
    },
    { name: "project", query: () => prisma.project.findMany() },
    { name: "task", query: () => prisma.task.findMany() },
    { name: "task_detail", query: () => prisma.task_detail.findMany() },
    { name: "supplier", query: () => prisma.supplier.findMany() },
    { name: "contractor", query: () => prisma.contractor.findMany() },
  ];

  for (const t of tables) {
    try {
      const data = await t.query();
      if (data.length > 0) {
        console.log(`\n=== ${t.name} (${data.length} rows) ===`);
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log(`\n=== ${t.name}: EMPTY ===`);
      }
    } catch (e: any) {
      console.log(`\n=== ${t.name}: ERROR - ${e.message} ===`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
