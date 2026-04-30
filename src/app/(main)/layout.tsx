import type { Metadata } from "next";
import "../globals.css";
import MainLayoutClient from "./MainLayoutClient";
import { getPublicBranding } from "@/lib/actions/actionOrgSetting";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getPublicBranding();
  const orgName = branding.ORG_NAME || "HomeX";
  const logoUrl = branding.ORG_LOGO_URL || "/logo.png";

  return {
    title: {
      template: `${orgName} | %s`,
      default: orgName,
    },
    description: "Project Management System",
    icons: {
      icon: logoUrl,
    },
  };
}

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MainLayoutClient>{children}</MainLayoutClient>;
}
