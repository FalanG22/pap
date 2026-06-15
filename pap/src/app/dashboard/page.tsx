"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Building2, ClipboardCheck, Clock, CheckCircle2, Send, Hospital } from "lucide-react";

type LabStat = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  is_active: boolean;
  role: string;
  stats: { total: number; pending: number; inProgress: number; completed: number; delivered: number };
};

export default function DashboardPage() {
  const router = useRouter();
  const [labs, setLabs] = useState<LabStat[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/lab-stats");
        if (res.ok && mounted) setLabs(await res.json());
      } catch { /* silent */ }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = labs.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.slug.toLowerCase().includes(search.toLowerCase())
  );

  const totalAll = labs.reduce((s, l) => s + l.stats.total, 0);
  const pendingAll = labs.reduce((s, l) => s + l.stats.pending, 0);
  const completedAll = labs.reduce((s, l) => s + l.stats.completed, 0);

  return (
    <div className="min-h-screen">
      <div className="px-6 py-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Resumen general de laboratorios</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Laboratorios",
              value: labs.length,
              icon: Hospital,
              trend: "+2",
              trendUp: true,
              accent: "from-primary/20 to-primary/5",
              iconBg: "bg-gradient-to-br from-primary/10 to-primary/5",
              iconColor: "text-primary",
              barColor: "bg-primary",
            },
            {
              label: "Órdenes totales",
              value: totalAll,
              icon: ClipboardCheck,
              trend: "+12%",
              trendUp: true,
              accent: "from-blue-400/20 to-blue-400/5",
              iconBg: "bg-gradient-to-br from-blue-50 to-blue-100",
              iconColor: "text-blue-600",
              barColor: "bg-blue-500",
            },
            {
              label: "Pendientes",
              value: pendingAll,
              icon: Clock,
              trend: pendingAll > 0 ? `+${pendingAll}` : "0",
              trendUp: pendingAll > 5,
              accent: "from-amber-400/20 to-amber-400/5",
              iconBg: "bg-gradient-to-br from-amber-50 to-amber-100",
              iconColor: "text-amber-600",
              barColor: "bg-amber-500",
            },
            {
              label: "Completados",
              value: completedAll,
              icon: CheckCircle2,
              trend: completedAll > 0 ? `${Math.round((completedAll / (totalAll || 1)) * 100)}%` : "0%",
              trendUp: true,
              accent: "from-emerald-400/20 to-emerald-400/5",
              iconBg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
              iconColor: "text-emerald-600",
              barColor: "bg-emerald-500",
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="relative group rounded-2xl border border-border/50 bg-card p-5 overflow-hidden hover:shadow-md hover:border-border/80 transition-all duration-300"
              >
                {/* Gradient accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${s.barColor} opacity-60`} />

                {/* Subtle background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${s.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10 space-y-3">
                  {/* Top row */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                      {s.label}
                    </span>
                    <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-4 h-4 ${s.iconColor}`} />
                    </div>
                  </div>

                  {/* Value */}
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold font-heading tracking-tight tabular-nums">
                      {s.value}
                    </span>
                    {/* Trend badge */}
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium mb-1 ${
                      s.trendUp
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      <svg className={`w-2.5 h-2.5 ${s.trendUp ? "" : "rotate-180"}`} viewBox="0 0 10 10" fill="currentColor">
                        <path d="M5 1l4 6H1z" />
                      </svg>
                      {s.trend}
                    </span>
                  </div>

                  {/* Mini progress bar (decorative) */}
                  <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.barColor} opacity-40 transition-all duration-700`}
                      style={{
                        width: `${s.label === "Laboratorios" ? 100 : s.label === "Órdenes totales" ? 100 : s.label === "Pendientes" ? Math.min((pendingAll / (totalAll || 1)) * 100, 100) : Math.min((completedAll / (totalAll || 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search + CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar laboratorio..." className="pl-9 h-10 rounded-xl bg-card border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button size="sm" className="rounded-xl gap-1.5 shrink-0" onClick={() => router.push("/dashboard/labs")}>
            <Plus className="w-4 h-4" /> Nuevo laboratorio
          </Button>
        </div>

        {/* Lab cards */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card p-5 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-14 bg-muted rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No hay laboratorios</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {search ? "Probá con otro término de búsqueda" : "Creá tu primer laboratorio para empezar"}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((lab) => (
              <div
                key={lab.id}
                onClick={() => router.push(`/dashboard/lab/${lab.id}`)}
                className="rounded-xl border border-border/50 bg-card p-5 hover:shadow-md hover:border-primary/20 hover:bg-accent/20 transition-all cursor-pointer space-y-4 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{lab.name}</p>
                      <p className="text-xs text-muted-foreground">{lab.stats.total} órdenes</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    lab.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}>
                    {lab.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded-lg bg-amber-50/50 border border-amber-100/30">
                    <p className="text-lg font-bold text-amber-600">{lab.stats.pending}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pend.</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-blue-50/50 border border-blue-100/30">
                    <p className="text-lg font-bold text-blue-600">{lab.stats.inProgress}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Proceso</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-emerald-50/50 border border-emerald-100/30">
                    <p className="text-lg font-bold text-emerald-600">{lab.stats.completed + lab.stats.delivered}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Listos</p>
                  </div>
                </div>

                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {lab.stats.completed} completados</span>
                  <span className="flex items-center gap-1"><Send className="w-3 h-3 text-blue-500" /> {lab.stats.delivered} enviados</span>
                </div>

                {lab.email && (
                  <p className="text-xs text-muted-foreground/60 font-mono truncate">{lab.email}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
