import MainDashboard from "@/components/projects/dashboard/main/MainDashboard";
import { auth } from "@/auth";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Dashboard",
};
const page = async () => {
  const session = await auth();
  const currentUserId = session?.user?.id ? parseInt(session.user.id) : 0;
  const organizationId = session?.user.organizationId ?? 0;
  const userType = session?.user.positionName ?? "";
  return <MainDashboard organizationId={organizationId} />;
};

export default page;
