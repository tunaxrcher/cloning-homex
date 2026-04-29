import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Resetting database...");

  // ========================================
  // STEP 1: DELETE ALL (child → parent order)
  // ========================================
  // Disable FK checks for MySQL to avoid ordering issues
  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0;");

  await prisma.project_clone_progress.deleteMany();
  await prisma.camera_analytics.deleteMany();
  await prisma.point360history.deleteMany();
  await prisma.point360.deleteMany();
  await prisma.floorplan.deleteMany();
  await prisma.camera.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.story_view.deleteMany();
  await prisma.story.deleteMany();
  await prisma.purchase_order_item.deleteMany();
  await prisma.purchase_order.deleteMany();
  await prisma.procurement_history.deleteMany();
  await prisma.procurement_task_link.deleteMany();
  await prisma.procurement_supplier_quote.deleteMany();
  await prisma.procurement_item_image.deleteMany();
  await prisma.procurement_suggestion.deleteMany();
  await prisma.procurement_item.deleteMany();
  await prisma.feed_comment_like.deleteMany();
  await prisma.feed_share.deleteMany();
  await prisma.feed_comment.deleteMany();
  await prisma.feed_like.deleteMany();
  await prisma.feed_post.deleteMany();
  await prisma.task_actual_cost.deleteMany();
  await prisma.task_contractor.deleteMany();
  await prisma.task_dependency.deleteMany();
  await prisma.task_user.deleteMany();
  await prisma.task_detail.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project_user.deleteMany();
  await prisma.project_img.deleteMany();
  await prisma.project_file.deleteMany();
  await prisma.project.deleteMany();
  await prisma.projects_running.deleteMany();
  await prisma.contractor.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.organization_setting.deleteMany();
  await prisma.position_permission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.position.deleteMany();
  await prisma.organization.deleteMany();

  // Reset AUTO_INCREMENT for all tables
  const tables = [
    "project_clone_progress", "camera_analytics", "point360history", "point360",
    "floorplan", "camera", "notification", "story_view", "story",
    "purchase_order_item", "purchase_order", "procurement_history",
    "procurement_task_link", "procurement_supplier_quote", "procurement_item_image",
    "procurement_suggestion", "procurement_item", "feed_comment_like", "feed_share",
    "feed_comment", "feed_like", "feed_post", "task_actual_cost", "task_contractor",
    "task_dependency", "task_user", "task_detail", "task", "project_user",
    "project_img", "project_file", "project", "projects_running", "contractor",
    "supplier", "organization_setting", "position_permission", "permission", "user", "position", "organization",
  ];
  for (const t of tables) {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`${t}\` AUTO_INCREMENT = 1;`);
  }

  // Re-enable FK checks
  await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1;");

  console.log("✅ All tables cleared + AUTO_INCREMENT reset");

  // ========================================
  // STEP 2: SEED DATA
  // ========================================
  console.log("🌱 Seeding...");

  // 1. Organization
  const org = await prisma.organization.create({
    data: {
      name: "HOMEX",
    },
  });
  console.log(`  ✅ Organization: ${org.name} (id: ${org.id})`);

  // 2. Position
  const position = await prisma.position.create({
    data: {
      positionName: "Spadmin",
      positionDesc: "เข้าได้ทุกอย่าง",
      isActive: true,
      organizationId: org.id,
    },
  });
  console.log(`  ✅ Position: ${position.positionName} (id: ${position.id})`);

  // 3. User (spadmin)
  const hashedPassword = await bcrypt.hash("supportspadmin", 10);
  const user = await prisma.user.create({
    data: {
      username: "spadmin",
      passwordHash: hashedPassword,
      isActive: true,
      displayName: "spadmin",
      organizationId: org.id,
      positionId: position.id,
    },
  });
  console.log(`  ✅ User: ${user.username} (id: ${user.id})`);

  // 4. Permissions
  const permSetting = await prisma.permission.create({
    data: {
      permissionKey: "PAGE_SETTING",
      permissionName: "ตั้งค่า",
      permissionDesc: "เข้าถึงการตั้งค่า",
      isActive: true,
      organizationId: org.id,
    },
  });
  const permUser = await prisma.permission.create({
    data: {
      permissionKey: "PAGE_USER",
      permissionName: "หน้าผู้ใช้งาน",
      isActive: true,
      organizationId: org.id,
    },
  });
  console.log(`  ✅ Permissions: ${permSetting.permissionKey}, ${permUser.permissionKey}`);

  // 5. Position ↔ Permission (grant all to Spadmin)
  await prisma.position_permission.createMany({
    data: [
      { positionId: position.id, permissionId: permSetting.id, allowed: true },
      { positionId: position.id, permissionId: permUser.id, allowed: true },
    ],
  });
  console.log(`  ✅ Position permissions linked`);

  // 6. Organization Settings (AI Prompt)
  await prisma.organization_setting.createMany({
    data: [
      {
        organizationId: org.id,
        settingKey: "AI_TASK_ROLE_PROMPT",
        settingValue:
          "คุณคือ AI ผู้เชี่ยวชาญระดับสูงด้านการบริหารโครงการ (Project Manager) การประเมินต้นทุน และการวางแผนงาน",
      },
      {
        organizationId: org.id,
        settingKey: "TASK_PLACEHOLDER",
        settingValue: "เช่น งานติดตั้ง, งานซ่อมแซม, งานตรวจสอบ",
      },
    ],
  });
  console.log(`  ✅ Organization settings: AI_TASK_ROLE_PROMPT, TASK_PLACEHOLDER`);

  console.log("\n🎉 Seed completed!");
  console.log("📌 Login: spadmin / Homex@1234");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
