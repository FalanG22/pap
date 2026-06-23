"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Plus, Building2, ClipboardCheck, Clock, CheckCircle2, Send, Hospital,
  Download, FileText, DownloadCloud, Filter, Loader2, CheckSquare, Square,
} from "lucide-react";
import { toast } from "sonner";

type LabStat = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  is_active: boolean;
  role: string;
  stats: { total: number; pending: number; inProgress: number; completed: number; delivered: number };
};

type OrderRow = {
  id: string;
  status: string;
  created_at: string;
  downloaded_at: string | null;
  downloaded_by: string | null;
  patient: { full_name: string; dni: string } | null;
  diagnosis: {
    general_category: string;
    descriptive_dx: string;
    is_signed: boolean;
  } | null;
};

const statusBadge: Record<string, { label: string; variant: "secondary" | "default" | "outline" | "destructive" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  in_progress: { label: "En proceso", variant: "secondary" },
  completed: { label: "Completado", variant: "default" },
  delivered: { label: "Enviado", variant: "outline" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [labs, setLabs] = useState<LabStat[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch("/api/me");
        const meData = await meRes.json();
        const superAdmin = meData.isSuperAdmin === true;
        setIsSuperAdmin(superAdmin);

        if (superAdmin) {
          const res = await fetch("/api/lab-stats");
          if (res.ok) setLabs(await res.json());
        } else if (meData.currentTenant) {
          const ordRes = await fetch(`/api/orders?tenant_id=${meData.currentTenant.id}`);
          if (ordRes.ok) setOrders(await ordRes.json());
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (isSuperAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (isSuperAdmin) {
    return <SuperAdminDashboard labs={labs} loading={loading} search={search} setSearch={setSearch} />;
  }

  return <LabDashboard orders={orders} setOrders={setOrders} loading={loading} />;
}

function SuperAdminDashboard({
  labs, loading, search, setSearch,
}: {
  labs: LabStat[]; loading: boolean; search: string; setSearch: (s: string) => void;
}) {
  const router = useRouter();

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
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Resumen general de doctores</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Doctores", value: labs.length, icon: Hospital, trend: "+2", trendUp: true, accent: "from-primary/20 to-primary/5", iconBg: "bg-gradient-to-br from-primary/10 to-primary/5", iconColor: "text-primary", barColor: "bg-primary" },
            { label: "Órdenes totales", value: totalAll, icon: ClipboardCheck, trend: "+12%", trendUp: true, accent: "from-blue-400/20 to-blue-400/5", iconBg: "bg-gradient-to-br from-blue-50 to-blue-100", iconColor: "text-blue-600", barColor: "bg-blue-500" },
            { label: "Pendientes", value: pendingAll, icon: Clock, trend: pendingAll > 0 ? `+${pendingAll}` : "0", trendUp: pendingAll > 5, accent: "from-amber-400/20 to-amber-400/5", iconBg: "bg-gradient-to-br from-amber-50 to-amber-100", iconColor: "text-amber-600", barColor: "bg-amber-500" },
            { label: "Completados", value: completedAll, icon: CheckCircle2, trend: completedAll > 0 ? `${Math.round((completedAll / (totalAll || 1)) * 100)}%` : "0%", trendUp: true, accent: "from-emerald-400/20 to-emerald-400/5", iconBg: "bg-gradient-to-br from-emerald-50 to-emerald-100", iconColor: "text-emerald-600", barColor: "bg-emerald-500" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="relative group rounded-2xl border border-border/50 bg-card p-5 overflow-hidden hover:shadow-md hover:border-border/80 transition-all duration-300">
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${s.barColor} opacity-60`} />
                <div className={`absolute inset-0 bg-gradient-to-br ${s.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">{s.label}</span>
                    <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-4 h-4 ${s.iconColor}`} />
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold font-heading tracking-tight tabular-nums">{s.value}</span>
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium mb-1 ${s.trendUp ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      <svg className={`w-2.5 h-2.5 ${s.trendUp ? "" : "rotate-180"}`} viewBox="0 0 10 10" fill="currentColor"><path d="M5 1l4 6H1z" /></svg>
                      {s.trend}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
                    <div className={`h-full rounded-full ${s.barColor} opacity-40 transition-all duration-700`}
                      style={{ width: `${s.label === "Doctores" ? 100 : s.label === "Órdenes totales" ? 100 : s.label === "Pendientes" ? Math.min((pendingAll / (totalAll || 1)) * 100, 100) : Math.min((completedAll / (totalAll || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar doctor..." className="pl-9 h-10 rounded-xl bg-card border-border/50" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button size="sm" className="rounded-xl gap-1.5 shrink-0" onClick={() => router.push("/dashboard/labs")}>
            <Plus className="w-4 h-4" /> Nuevo Doctor
          </Button>
        </div>

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
            <p className="text-muted-foreground font-medium">No hay doctores</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {search ? "Probá con otro término de búsqueda" : "Creá tu primer Doctor para empezar"}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(lab => (
              <div key={lab.id} onClick={() => router.push(`/dashboard/lab/${lab.id}`)}
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
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${lab.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : 'bg-muted text-muted-foreground border-border'}`}>
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
                {lab.email && <p className="text-xs text-muted-foreground/60 font-mono truncate">{lab.email}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LabDashboard({ orders, setOrders, loading }: { orders: OrderRow[]; setOrders: (o: OrderRow[]) => void; loading: boolean }) {
  const [downloadTab, setDownloadTab] = useState("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sendingBatch, setSendingBatch] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (ids: string[]) => {
    setSelectedIds(prev => {
      const allSelected = ids.every(id => prev.has(id));
      if (allSelected) return new Set();
      return new Set(ids);
    });
  };

  const pendingSendCount = orders.filter(o => o.status === 'completed' && o.diagnosis?.is_signed).length;

  const handleBatchSend = async () => {
    setSendingBatch(true);
    try {
      const res = await fetch("/api/send-batch", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error al enviar"); return; }
      toast.success(`${data.count} diagnóstico${data.count !== 1 ? 's' : ''} enviado${data.count !== 1 ? 's' : ''} al Doctor`);
      setOrders(orders.map(o => o.status === 'completed' ? { ...o, status: 'delivered' } : o));
    } catch { toast.error("Error de conexión"); }
    finally { setSendingBatch(false); }
  };

  const handleDownload = async (orderId: string) => {
    setDownloadingId(orderId);
    try {
      const res = await fetch(`/api/download/${orderId}`, { method: "POST" });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error al registrar descarga"); return; }
      window.open(`/api/pdf/${orderId}`, '_blank');
      setOrders(orders.map(o =>
        o.id === orderId ? { ...o, downloaded_at: new Date().toISOString() } : o
      ));
    } catch {
      toast.error("Error al descargar");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setDownloadingId("batch");
    try {
      for (const id of ids) {
        const res = await fetch(`/api/download/${id}`, { method: "POST" });
        if (res.ok) window.open(`/api/pdf/${id}`, '_blank');
      }
      setOrders(orders.map(o =>
        selectedIds.has(o.id) ? { ...o, downloaded_at: new Date().toISOString() } : o
      ));
      setSelectedIds(new Set());
      toast.success(`Descargando ${ids.length} diagnóstico${ids.length !== 1 ? 's' : ''}`);
    } catch {
      toast.error("Error al descargar");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleBatchDownload = async (categoryOrders: OrderRow[]) => {
    for (const o of categoryOrders) {
      try {
        await fetch(`/api/download/${o.id}`, { method: "POST" });
        window.open(`/api/pdf/${o.id}`, '_blank');
      } catch { /* continue */ }
    }
    setOrders(orders.map(o =>
      categoryOrders.some(co => co.id === o.id) ? { ...o, downloaded_at: new Date().toISOString() } : o
    ));
    toast.success(`Descargando ${categoryOrders.length} órdenes`);
  };

  const downloadedOrders = orders.filter(o => o.downloaded_at);
  const pendingOrders = orders.filter(o => !o.downloaded_at && o.diagnosis?.is_signed);
  const signedOrders = orders.filter(o => o.diagnosis?.is_signed);

  const filteredByTab = downloadTab === "all" ? orders
    : downloadTab === "pending_download" ? pendingOrders
    : downloadedOrders;

  const categories = useMemo(() => {
    const map = new Map<string, OrderRow[]>();
    filteredByTab.forEach(o => {
      const cat = o.diagnosis?.general_category || "Sin categoría";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(o);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredByTab]);

  const filteredByCategory = categoryFilter === "all"
    ? filteredByTab
    : filteredByTab.filter(o => (o.diagnosis?.general_category || "Sin categoría") === categoryFilter);

  const allCategories = useMemo(() =>
    [...new Set(orders.filter(o => o.diagnosis?.general_category).map(o => o.diagnosis!.general_category))].sort(),
  [orders]);

  const downloaded = orders.filter(o => o.downloaded_at).length;
  const pendingCount = orders.filter(o => !o.downloaded_at && o.diagnosis?.is_signed).length;

  const downloadTabs = [
    { key: "all", label: "Todas" },
    { key: "pending_download", label: "Pendientes descarga" },
    { key: "downloaded", label: "Descargadas" },
  ];

  return (
    <div className="min-h-screen">
      <div className="px-6 py-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Panel del Doctor</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestión de órdenes y descargas</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Órdenes totales", value: orders.length, icon: ClipboardCheck, color: "from-blue-400/20 to-blue-400/5", bar: "bg-blue-500", iconBg: "bg-gradient-to-br from-blue-50 to-blue-100", iconColor: "text-blue-600" },
            { label: "Firmados", value: signedOrders.length, icon: CheckCircle2, color: "from-emerald-400/20 to-emerald-400/5", bar: "bg-emerald-500", iconBg: "bg-gradient-to-br from-emerald-50 to-emerald-100", iconColor: "text-emerald-600" },
            { label: "Pend. envío", value: pendingSendCount, icon: Send, color: "from-rose-400/20 to-rose-400/5", bar: "bg-rose-500", iconBg: "bg-gradient-to-br from-rose-50 to-rose-100", iconColor: "text-rose-600" },
            { label: "Pend. descarga", value: pendingCount, icon: DownloadCloud, color: "from-amber-400/20 to-amber-400/5", bar: "bg-amber-500", iconBg: "bg-gradient-to-br from-amber-50 to-amber-100", iconColor: "text-amber-600" },
            { label: "Descargadas", value: downloaded, icon: Download, color: "from-violet-400/20 to-violet-400/5", bar: "bg-violet-500", iconBg: "bg-gradient-to-br from-violet-50 to-violet-100", iconColor: "text-violet-600" },
          ].map(s => {
            const Icon = s.icon;
            const pct = orders.length ? Math.round((s.value / orders.length) * 100) : 0;
            return (
              <div key={s.label} className="relative group rounded-2xl border border-border/50 bg-card p-5 overflow-hidden hover:shadow-md hover:border-border/80 transition-all duration-300">
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${s.bar} opacity-60`} />
                <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">{s.label}</span>
                    <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-4 h-4 ${s.iconColor}`} />
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold font-heading tracking-tight tabular-nums">{s.value}</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium mb-1 ${pct > 0 ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
                    <div className={`h-full rounded-full ${s.bar} opacity-40`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {pendingSendCount > 0 && (
          <div className="rounded-xl border border-rose-200/50 bg-rose-50/30 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Send className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-rose-800">{pendingSendCount} diagnóstico{pendingSendCount !== 1 ? 's' : ''} pendiente{pendingSendCount !== 1 ? 's' : ''} de envío</p>
                <p className="text-xs text-rose-600/70">Enviar todos al Doctor en un solo email con PDFs adjuntos</p>
              </div>
            </div>
            <Button onClick={handleBatchSend} disabled={sendingBatch}
              className="rounded-xl gap-1.5 shrink-0 bg-rose-600 hover:bg-rose-700">
              <Send className="w-4 h-4" />
              {sendingBatch ? "Enviando..." : `Enviar ${pendingSendCount} diagnóstico${pendingSendCount !== 1 ? 's' : ''}`}
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {downloadTabs.map(tab => (
              <button key={tab.key} onClick={() => setDownloadTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  downloadTab === tab.key ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {tab.label}
                <span className="opacity-60">({
                  tab.key === "all" ? orders.length
                    : tab.key === "pending_download" ? pendingCount
                    : downloaded
                })</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar paciente..." className="pl-9 h-10 rounded-xl bg-card border-border/50" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="h-10 rounded-xl border border-border/50 bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="all">Todas las categorías</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {pendingSendCount > 0 && (
              <Button onClick={handleBatchSend} disabled={sendingBatch}
                className="rounded-xl gap-1.5 bg-rose-600 hover:bg-rose-700 h-10 shrink-0">
                <Send className="w-4 h-4" />
                {sendingBatch ? "Enviando..." : `Enviar (${pendingSendCount})`}
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredByCategory.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">
              {downloadTab === "pending_download"
                ? "No hay órdenes pendientes de descarga"
                : downloadTab === "downloaded"
                ? "No hay órdenes descargadas"
                : "No hay órdenes"}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {downloadTab === "pending_download"
                ? "Firmá los diagnósticos para que aparezcan aquí"
                : "Las órdenes aparecerán cuando tengan diagnóstico"}
            </p>
          </div>
        ) : (
          <>
          {selectedIds.size > 0 && (
            <div className="sticky top-4 z-20 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-3 flex items-center justify-between gap-3 shadow-sm">
              <span className="text-sm font-medium">{selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-lg text-xs h-8" onClick={() => setSelectedIds(new Set())}>
                  Cancelar
                </Button>
                <Button size="sm" className="rounded-lg text-xs h-8 gap-1" disabled={downloadingId === "batch"}
                  onClick={handleDownloadSelected}>
                  {downloadingId === "batch" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DownloadCloud className="w-3.5 h-3.5" />}
                  {downloadingId === "batch" ? "Descargando..." : `Descargar (${selectedIds.size})`}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {categories.filter(([cat]) => categoryFilter === "all" || cat === categoryFilter).map(([category, catOrders]) => {
              const searched = catOrders.filter(o =>
                !search ||
                o.patient?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                o.patient?.dni?.includes(search)
              );
              if (searched.length === 0) return null;
              const hasPending = searched.some(o => !o.downloaded_at);
              const catAllSelected = searched.every(o => selectedIds.has(o.id));
              return (
                <div key={category} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleSelectAll(searched.map(o => o.id))}
                        className="flex items-center gap-2 text-left">
                        {catAllSelected
                          ? <CheckSquare className="w-4 h-4 text-primary" />
                          : <Square className="w-4 h-4 text-muted-foreground" />
                        }
                      </button>
                      <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{category}</span>
                      <Badge variant="secondary" className="text-[10px]">{searched.length}</Badge>
                    </div>
                    {hasPending && downloadTab !== "downloaded" && (
                      <Button variant="ghost" size="sm" className="text-xs gap-1 h-8"
                        onClick={() => handleBatchDownload(searched.filter(o => !o.downloaded_at))}
                      >
                        <DownloadCloud className="w-3 h-3" /> Descargar pendientes ({searched.filter(o => !o.downloaded_at).length})
                      </Button>
                    )}
                  </div>
                  <div className="divide-y divide-border/20">
                    {searched.map(o => {
                      const badge = statusBadge[o.status] || { label: o.status, variant: "secondary" };
                      const isDownloaded = !!o.downloaded_at;
                      return (
                        <div key={o.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
                        >
                          <div className="min-w-0 flex-1 flex items-center gap-4">
                            <button onClick={() => toggleSelect(o.id)} className="shrink-0">
                              {selectedIds.has(o.id)
                                ? <CheckSquare className="w-4 h-4 text-primary" />
                                : <Square className="w-4 h-4 text-muted-foreground" />
                              }
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{o.patient?.full_name || "—"}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="font-mono">{o.patient?.dni || "—"}</span>
                                <span>{new Date(o.created_at).toLocaleDateString("es-AR")}</span>
                              </div>
                            </div>
                            <Badge variant={badge.variant} className="text-xs shrink-0">{badge.label}</Badge>
                            {isDownloaded ? (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium shrink-0">
                                <Download className="w-3 h-3" /> Descargado
                              </span>
                            ) : o.diagnosis?.is_signed ? (
                              <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium shrink-0">
                                <Clock className="w-3 h-3" /> Pendiente
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-3">
                            {o.diagnosis?.is_signed && (
                              <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]"
                                onClick={() => handleDownload(o.id)}
                                disabled={downloadingId === o.id || downloadingId === "batch"}
                              >
                                {downloadingId === o.id
                                  ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                  : <Download className={`w-4 h-4 ${isDownloaded ? "text-emerald-500" : "text-muted-foreground"}`} />
                                }
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
        )}
      </div>
    </div>
  );
}
