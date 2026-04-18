"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  LayoutDashboard,
  TrendingUp,
  ArrowLeftRight,
  Building2,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  History,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/inversiones", label: "Inversiones", icon: TrendingUp },
  { href: "/dashboard/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/dashboard/historico", label: "Histórico", icon: History },
  { href: "/dashboard/instituciones", label: "Instituciones", icon: Building2 },
  { href: "/dashboard/titulares", label: "Titulares", icon: Users },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-56 flex flex-col z-50"
      style={{ background: "#0E1628", borderRight: "1px solid #1A2744" }}>
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #00D9FF22, #00E5A022)", border: "1px solid #00D9FF44" }}>
          <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
            <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke="#00D9FF" strokeWidth="2" fill="none"/>
            <circle cx="14" cy="14" r="3" fill="#00D9FF"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary leading-none">Portfolio</p>
          <p className="text-xs text-text-muted mt-0.5">Inversiones</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group nav-item${isActive ? " nav-item-active" : ""}`}
              style={{
                background: isActive ? "#162040" : "transparent",
                color: isActive ? "#00D9FF" : "#7A8FB0",
                border: isActive ? "1px solid #00D9FF22" : "1px solid transparent",
              }}>
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight size={12} />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "#1A2744" }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full transition-all"
          style={{ color: "#7A8FB0" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#7A8FB0")}>
          <LogOut size={16} />
          <span>Salir</span>
        </button>
      </div>
    </aside>
  );
}
