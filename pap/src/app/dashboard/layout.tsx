"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserRound,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Receipt,
  Microscope,
} from "lucide-react";
import { cn } from "@/lib/utils";

const superAdminNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/pacientes", label: "Pacientes", icon: UserRound },
  { href: "/dashboard/labs", label: "Doctores", icon: Building2 },
  { href: "/dashboard/facturacion", label: "Facturación", icon: Receipt },
  { href: "/dashboard/users", label: "Usuarios", icon: Users },
  { href: "/dashboard/macros", label: "Macros", icon: FileText },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

const labNav = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/dashboard/pacientes", label: "Pacientes", icon: UserRound },
  { href: "/dashboard/facturacion", label: "Facturación", icon: Receipt },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [labName, setLabName] = useState("");

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(data => {
      setIsSuperAdmin(data.isSuperAdmin === true);
      if (data.currentTenant) setLabName(data.currentTenant.name);
    }).catch(() => setIsSuperAdmin(false));
  }, []);

  const handleLogout = async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    router.push("/login");
  };

  const navItems = isSuperAdmin ? superAdminNav : labNav;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen bg-card border-r border-border/50 flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-16 border-b border-border/40 px-4",
          collapsed ? "justify-center" : "gap-3"
        )}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm shrink-0">
            <Microscope className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-heading font-bold leading-tight">PAP</p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate">
                {isSuperAdmin ? "Diagnóstico" : labName || "Doctor"}
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  collapsed && "justify-center px-2",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {active && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className={cn(
          "border-t border-border/40 p-3 space-y-2",
          collapsed && "flex flex-col items-center"
        )}>
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 right-4 z-30 lg:hidden w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
