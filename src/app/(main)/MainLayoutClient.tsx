"use client";

import { useState, useEffect } from "react";
import { HomexNavbar } from "@/components/HomexNavbar";
import { HomexSidebar } from "@/components/HomexSidebar";

export default function MainLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const savedState = localStorage.getItem("homex-sidebar-state");
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("homex-sidebar-state", JSON.stringify(newState));
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex relative">
      <HomexSidebar
        isOpenSideBar={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isCollapsed}
      />

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out
        ${isCollapsed ? "md:pl-[80px]" : "md:pl-[280px]"} 
        `}
      >
        <HomexNavbar
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleCollapse={handleToggleCollapse}
          isCollapsed={isCollapsed}
        />

        <main className="flex-1 p-6 w-full max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
