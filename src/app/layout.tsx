import type { Metadata } from "next";
import { getPublicBranding } from "@/lib/actions/actionOrgSetting";
import "./globals.css";
import { Providers } from "../components/Providers/providers";
import { SessionProvider } from "next-auth/react";
import {
  IBM_Plex_Sans_Thai,
  IBM_Plex_Sans_Thai_Looped,
} from "next/font/google";
import { ToastContainer } from "react-toastify";
import { auth } from "@/auth";
import IdleTimeoutHandler from "@/components/IdleTimeoutHandler";
import ThemeColorProvider from "@/components/Providers/ThemeColorProvider";
import { getOrgSetting } from "@/lib/actions/actionOrgSetting";
import { SETTING_KEYS } from "@/lib/settingKeys";

const fontSans = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getPublicBranding();
  const orgName = branding.ORG_NAME || "HomeX";
  const logoUrl = branding.ORG_LOGO_URL || "/logo.png";

  return {
    title: {
      default: orgName,
      template: `%s | ${orgName}`,
    },
    description: "Project Management System",
    icons: {
      icon: [{ url: logoUrl, href: logoUrl }],
      apple: [{ url: logoUrl }],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const primaryColor = await getOrgSetting(SETTING_KEYS.ORG_PRIMARY_COLOR) || "blue";
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable}  font-sans antialiased`}>
        <SessionProvider
          session={session}
          refetchInterval={0}
          refetchOnWindowFocus={false}
        >
          <IdleTimeoutHandler />
          <ThemeColorProvider colorKey={primaryColor}>
            <Providers>{children}</Providers>
          </ThemeColorProvider>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastClassName="default-toast-body"
          />
        </SessionProvider>
      </body>
    </html>
  );
}
