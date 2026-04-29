// app/components/ThemeSwitcher.tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeSwitcher() {

  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
        <div className="h-10 w-10 rounded-full border border-zinc-200 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-sm" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 border border-zinc-200 shadow-sm backdrop-blur-sm transition-all hover:bg-zinc-100 focus:outline-none dark:bg-zinc-900/80 dark:border-zinc-800 dark:hover:bg-zinc-800"
      aria-label="Toggle Dark Mode"
    >
      {theme === "dark" ? (
        <Sun size={20} className="text-yellow-500" />
      ) : (
        <Moon size={20} className="text-zinc-500" />
      )}
    </button>
  );
}