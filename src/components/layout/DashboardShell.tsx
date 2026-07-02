"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

const STORAGE_KEY = "sidebar_collapsed";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      <main className={`min-h-screen transition-[margin] duration-300 ${collapsed ? "md:ml-16" : "md:ml-56"}`}>
        <div className="pt-16 p-4 md:pt-8 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
