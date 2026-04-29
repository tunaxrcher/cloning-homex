import type { Metadata } from "next";
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

const fontSans = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HomeX",
  description: "Project Management System",
  icons: {
    icon: [
      {
        url: "/logo.png",
        href: "/logo.png",
      },
    ],
    apple: [
      {
        url: "/logo.png",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable}  font-sans antialiased`}>
        <SessionProvider
          session={session}
          refetchInterval={0}
          refetchOnWindowFocus={false}
        >
          <IdleTimeoutHandler />
          <Providers>{children}</Providers>
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
