import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import MainPageSetting from "@/components/settings/MainPageSetting";

export const dynamic = "force-dynamic";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setting",
};

const Page = async () => {

  const session = await auth();
  const organizationId = Number(session?.user.organizationId);

  const positions = await prisma.position.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  const permissions = await prisma.permission.findMany({
    where: { organizationId },
    include: { positions: true },
    orderBy: { createdAt: "desc" },
  });

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  const contractors = await prisma.contractor.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  const settingsRaw = await prisma.organization_setting.findMany({
    where: { organizationId },
  });
  const aiSettings: Record<string, string> = {};
  for (const s of settingsRaw) {
    aiSettings[s.settingKey] = s.settingValue;
  }

  return (
    <MainPageSetting
      positions={positions}
      permissions={permissions}
      suppliers={suppliers}
      contractors={contractors}
      aiSettings={aiSettings}
    />
  );
};

export default Page;