import type { Metadata } from "next";
import "../globals.css";
import MainLayoutClient from "./MainLayoutClient";

export const metadata: Metadata = {
  title: {
    template: "HomeX | %s",
    default: "Homex",
  },
  description: "Project Management System",
  icons: {
    icon: "/logo.png",
  },
};

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MainLayoutClient>{children}</MainLayoutClient>;
}
