"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Search, FileText, LogOut, ArrowLeft, Building2, ChevronDown, Download, CheckSquare, Square } from "lucide-react";

type DoctorInfo = {
  name: string;
  slug: string;
  email: string | null;
  config: Record<string, unknown>;
  createdAt: string;
};

type OrderWithDiagnosis = {
  id: string;
  patient: { full_name: string; dni: string };
  status: string;
  created_at: string;
  diagnosis?: {
    general_category: string;
    descriptive_dx: string;
    is_signed: boolean;
    signed_at: string | null;
  } | null;
};

const statusFilter = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendiente" },
  { key: "in_progress", label: "En proceso" },
  { key: "completed", label: "Listo" },
  { key: "delivered", label: "Enviado" },
];

export default function LabPortalPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithDiagnosis[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<DoctorInfo | null>(null);
  const [showDoctorInfo, setShowDoctorInfo] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDiagnosis | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [ordersRes, doctorRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/portal-lab-tenant"),
        ]);
        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (doctorRes.ok) setDoctor(await doctorRes.json());
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(r => r.id)));
    }
  };

  const downloadPdf = (orderId: string) => {
    window.open(`/api/pdf/${orderId}?download=1`, '_blank');
  };

  const downloadSelected = async () => {
    if (selectedIds.size === 0) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/pdf/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: Array.from(selectedIds) }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "diagnosticos.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
    finally { setDownloading(false); }
  };

  const handleLogout = async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    router.push("/login");
  };

  const filtered = orders.filter((r) => {
    const matchesSearch =
      r.patient?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.patient?.dni?.includes(search);
    const matchesFilter = filter === "all" || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "secondary" | "outline" | "default" | "destructive" }> = {
      pending: { label: "Pendiente", variant: "secondary" },
      in_progress: { label: "En proceso", variant: "secondary" },
      completed: { label: "Listo", variant: "default" },
      delivered: { label: "Enviado", variant: "outline" },
    };
    return map[status] || { label: status, variant: "secondary" };
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-heading font-bold text-xs">
                P
              </div>
            </Link>
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-heading font-bold">Portal del Doctor</span>
            {doctor && (
              <div className="relative">
                <button onClick={() => setShowDoctorInfo(!showDoctorInfo)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-1">
                  <span className="hidden sm:inline truncate max-w-[120px]">{doctor.name}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showDoctorInfo ? 'rotate-180' : ''}`} />
                </button>
                {showDoctorInfo && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDoctorInfo(false)} />
                    <div className="absolute top-full right-0 mt-2 w-64 rounded-xl border border-border/50 bg-card shadow-lg p-4 z-20 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{doctor.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{doctor.slug}</p>
                        </div>
                      </div>
                      {doctor.email && (
                        <p className="text-xs text-muted-foreground font-mono">{doctor.email}</p>
                      )}
                      <div className="text-xs text-muted-foreground space-y-1 border-t border-border/30 pt-3">
                        <p>Desde {new Date(doctor.createdAt).toLocaleDateString("es-AR", {
                          day: "numeric", month: "long", year: "numeric",
                        })}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground gap-1.5">
            <LogOut className="w-3.5 h-3.5" /> Salir
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-5">
          {selectedOrder ? (
            <div className="space-y-4">
              <button onClick={() => setSelectedOrder(null)}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver al listado
              </button>

              <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-heading font-semibold">{selectedOrder.patient?.full_name}</h2>
                      <p className="text-xs text-muted-foreground font-mono">DNI: {selectedOrder.patient?.dni}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => downloadPdf(selectedOrder.id)}
                      className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                    <Badge variant={statusBadge(selectedOrder.status).variant}>
                      {statusBadge(selectedOrder.status).label}
                    </Badge>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Fecha de creación</p>
                    <p>{new Date(selectedOrder.created_at).toLocaleDateString("es-AR")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Orden #</p>
                    <p className="font-mono text-xs">#{selectedOrder.id.slice(0, 8)}</p>
                  </div>
                </div>

                {selectedOrder.diagnosis?.is_signed && (
                  <div className="pt-4 border-t border-border/30 space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Diagnóstico
                    </h3>
                    <div className="rounded-lg bg-muted/30 p-4 space-y-2">
                      <p className="text-sm font-medium">{selectedOrder.diagnosis.general_category}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {selectedOrder.diagnosis.descriptive_dx}
                      </p>
                    </div>
                    {selectedOrder.diagnosis.signed_at && (
                      <p className="text-xs text-muted-foreground">
                        Firmado: {new Date(selectedOrder.diagnosis.signed_at).toLocaleDateString("es-AR", {
                          day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-heading font-bold tracking-tight">Órdenes</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Listado de órdenes</p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar paciente..." className="pl-9 h-10 rounded-xl bg-card border-border/50" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                {filtered.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button onClick={toggleSelectAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors">
                      {selectedIds.size === filtered.length ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      {selectedIds.size === filtered.length ? "Deseleccionar" : "Seleccionar"}
                    </button>
                    {selectedIds.size > 0 && (
                      <button onClick={downloadSelected} disabled={downloading}
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs font-medium disabled:opacity-50">
                        <Download className="w-3.5 h-3.5" />
                        {downloading ? "Descargando..." : `Descargar (${selectedIds.size})`}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {statusFilter.map((f) => (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      filter === f.key ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {f.label}
                    {f.key !== "all" && (
                      <span className="ml-1 opacity-60">{orders.filter((r) => r.status === f.key).length}</span>
                    )}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">No se encontraron resultados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((result) => {
                    const badge = statusBadge(result.status);
                    const isSelected = selectedIds.has(result.id);
                    return (
                      <div key={result.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected ? 'border-primary/40 bg-primary/5' : 'border-border/50 bg-card hover:shadow-sm hover:border-primary/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1" onClick={() => setSelectedOrder(result)}>
                          <button onClick={(e) => { e.stopPropagation(); toggleSelect(result.id); }}
                            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                          </button>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{result.patient?.full_name || "—"}</p>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                              <span className="font-mono">DNI: {result.patient?.dni || "—"}</span>
                              <span>{new Date(result.created_at).toLocaleDateString("es-AR")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                          <button onClick={(e) => { e.stopPropagation(); downloadPdf(result.id); }}
                            className="min-w-[44px] min-h-[44px] rounded-lg bg-muted/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
                            title="Descargar PDF">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
