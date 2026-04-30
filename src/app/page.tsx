import SigninForm from "@/components/auth/forms/SigninForm";
import SearchHandler from "@/components/SearchHandler";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getPublicBranding } from "@/lib/actions/actionOrgSetting";

export default async function LoginPage() {
  const branding = await getPublicBranding();

  const logoUrl = branding.ORG_LOGO_URL || "/logo.png";
  const welcomeText = branding.ORG_WELCOME_TEXT || "Welcome to HomeX";
  const tagline = branding.ORG_TAGLINE || "Smart Work";

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin h-10 w-10 text-primary mb-3" />
            <p className="text-lg text-muted-foreground">กำลังโหลด...</p>
          </div>
        </div>
      }
    >
      <SearchHandler />
      <div className="relative flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black px-6 transition-colors duration-300">
        <main className="flex w-full max-w-sm flex-col items-center gap-8 bg-white p-8 dark:bg-zinc-950 sm:p-12 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800 transition-colors duration-300">
          <Link href="/">
            <Image
              className="rounded-xl dark:invert"
              src={logoUrl}
              alt="logo"
              width={120}
              height={24}
              priority
            />
          </Link>

          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              {welcomeText}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              {tagline}
            </p>
          </div>

          <SigninForm />

          <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/dashboard"
              className="font-semibold text-black dark:text-white hover:underline"
            >
              Get Started
            </Link>
          </div>
        </main>
      </div>
    </Suspense>
  );
}
