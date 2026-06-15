"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Building2, Clock, Archive, FileText, ArrowLeft, Mail, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

type OrderRow = {
  id: string;
  patient: { full_name: string; dni: string } | null;
  status: string;
  created_at: string;
  archived_at: string | null;
  downloaded_at: string | null;
  diagnosis?: { is_signed: boolean; signed_at: string | null } | null;
};

const statusTabs = [
  { key: "active", label: "Activas", icon: Clock },
  { key: "archived", label: "Archivadas", icon: Archive },
];

const statusBadge: Record<string, { label: string; variant: "secondary" | "default" | "outline" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  in_progress: { label: "En proceso", variant: "secondary" },
  completed: { label: "Completado", variant: "default" },
  delivered: { label: "Enviado", variant: "outline" },
};

export default function LabDetailPage() {
  const router = useRouter();
  const params = useParams<{ labId: string }>();
  const labId = params.labId;

  const [lab, setLab] = useState<{ name: string; email?: string } | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("active");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [dni, setDni] = useState("");
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sendingBatch, setSendingBatch] = useState(false);

  const handleDelete = async (orderId: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error al eliminar"); setDeleting(false); return; }
      toast.success("Orden eliminada");
      setDeleteTarget(null);
      load();
    } catch { toast.error("Error de conexión"); }
    finally { setDeleting(false); }
  };

  const load = useCallback(async () => {
    try {
      const [labRes, ordRes] = await Promise.all([
        fetch("/api/tenants"),
        fetch(`/api/orders?tenant_id=${labId}`),
      ]);
      if (labRes.ok) {
        const labs = await labRes.json();
        setLab(labs.find((l: { id: string }) => l.id === labId) || null);
      }
      if (ordRes.ok) setOrders(await ordRes.json());
    } catch { toast.error("Error de conexión"); }
    finally { setLoading(false); }
  }, [labId]);

  useEffect(() => { load(); }, [load]);

  const years = [...new Set(orders.map(o => new Date(o.created_at).getFullYear()))].sort((a, b) => b - a);
  const activeYear = selectedYear || years[0] || new Date().getFullYear();

  const filteredOrders = orders.filter(o => {
    const year = new Date(o.created_at).getFullYear();
    if (year !== activeYear) return false;
    if (statusTab === "active" && o.archived_at) return false;
    if (statusTab === "archived" && !o.archived_at) return false;
    const matchesSearch = o.patient?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.patient?.dni?.includes(search);
    return matchesSearch;
  });

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni || !fullName) { toast.error("DNI y Nombre son obligatorios"); return; }
    setSubmitting(true);
    try {
      const patRes = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni: dni.replace(/\./g, ""), full_name: fullName, birth_date: birthDate || null, sex: sex || null, email: email || null, phone: phone || null }),
      });
      if (!patRes.ok) { const err = await patRes.json(); toast.error(err.error || "Error al crear paciente"); setSubmitting(false); return; }
      const patient = await patRes.json();

      const ordRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patient.id, tenant_id: labId }),
      });
      if (!ordRes.ok) { const err = await ordRes.json(); toast.error(err.error || "Error al crear orden"); setSubmitting(false); return; }
      const order = await ordRes.json();

      toast.success(`Orden creada para ${fullName}`);
      setOpen(false);
      setDni(""); setFullName(""); setBirthDate(""); setSex(""); setEmail(""); setPhone("");
      load();
      router.push(`/dashboard/dx/${order.id}`);
    } catch { toast.error("Error de conexión"); }
    finally { setSubmitting(false); }
  };

  const pendingSendCount = orders.filter(o => o.status === 'completed' && o.diagnosis?.is_signed).length;

  const handleBatchSend = async () => {
    setSendingBatch(true);
    try {
      const res = await fetch("/api/send-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: labId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error al enviar"); return; }
      toast.success(`${data.count} diagnóstico${data.count !== 1 ? 's' : ''} enviado${data.count !== 1 ? 's' : ''} al laboratorio`);
      load();
    } catch { toast.error("Error de conexión"); }
    finally { setSendingBatch(false); }
  };

  const countActive = (year: number) => orders.filter(o => new Date(o.created_at).getFullYear() === year && !o.archived_at).length;
  const countArchived = (year: number) => orders.filter(o => new Date(o.created_at).getFullYear() === year && o.archived_at).length;

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Building2 className="w-5 h-5 text-primary" />
            <span className="font-heading font-bold">{lab?.name || "Cargando..."}</span>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium cursor-pointer">
              <Plus className="w-4 h-4" /> Nueva orden
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle className="font-heading">Nueva orden de diagnóstico</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateOrder} className="space-y-4 pt-2">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">DNI *</label>
                    <Input value={dni} onChange={e => setDni(e.target.value)} placeholder="12.345.678" className="h-10" autoFocus required />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre completo *</label>
                    <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="María Gómez" className="h-10" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha de nacimiento</label>
                    <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sexo</label>
                    <select value={sex} onChange={e => setSex(e.target.value)} className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                      <option value="">Seleccionar</option>
                      <option value="female">Femenino</option>
                      <option value="male">Masculino</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="paciente@mail.com" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Teléfono</label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="11 2345-6789" className="h-10" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "Creando..." : "Crear orden"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="px-6 py-6 max-w-5xl mx-auto space-y-6">
        {lab?.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-4 py-2.5">
            <Mail className="w-3.5 h-3.5" />
            <span>Email de envío: <span className="font-mono text-foreground/80">{lab.email}</span></span>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {years.map(year => (
            <button key={year} onClick={() => setSelectedYear(year)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeYear === year ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {year}
              <span className="ml-1.5 opacity-60">
                {countActive(year) + countArchived(year)}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2">
            {statusTabs.map(tab => (
              <button key={tab.key} onClick={() => setStatusTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusTab === tab.key ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                <span className="opacity-60">({tab.key === "active" ? countActive(activeYear) : countArchived(activeYear)})</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar paciente o DNI..." className="pl-9 h-10 rounded-xl bg-card border-border/50" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {pendingSendCount > 0 && (
            <Button onClick={handleBatchSend} disabled={sendingBatch}
              className="rounded-xl gap-1.5 bg-rose-600 hover:bg-rose-700 h-10 shrink-0">
              <Send className="w-4 h-4" />
              {sendingBatch ? "Enviando..." : `Enviar (${pendingSendCount})`}
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">
              No hay órdenes {statusTab === "archived" ? "archivadas" : "activas"} en {activeYear}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {statusTab === "active" ? "Creá una nueva orden para empezar" : "No hay órdenes archivadas en este año"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredOrders.map(o => {
              const badge = statusBadge[o.status] || { label: o.status, variant: "secondary" };
              return (
                <div key={o.id}
                  onClick={() => router.push(`/dashboard/dx/${o.id}`)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    o.archived_at
                      ? "border-border/30 bg-muted/30 hover:bg-muted/50"
                      : "border-border/50 bg-card hover:shadow-sm hover:border-primary/20"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium truncate ${o.archived_at ? "text-muted-foreground" : ""}`}>
                      {o.patient?.full_name || "—"}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="font-mono">DNI: {o.patient?.dni || "—"}</span>
                      <span>{new Date(o.created_at).toLocaleDateString("es-AR")}</span>
                      {o.archived_at && <span className="flex items-center gap-1"><Archive className="w-3 h-3" />Archivado</span>}
                    </div>
                  </div>
                  <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                  {!o.downloaded_at && (
                    <>
                      {deleteTarget === o.id ? (
                        <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
                          <Button variant="destructive" size="sm" className="h-7 rounded-lg text-[10px] px-2" disabled={deleting}
                            onClick={() => handleDelete(o.id)}>
                            {deleting ? "..." : "Confirmar"}
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 rounded-lg text-[10px] px-2" onClick={() => setDeleteTarget(null)}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" className="w-7 h-7 ml-1 text-muted-foreground hover:text-destructive"
                          onClick={e => { e.stopPropagation(); setDeleteTarget(o.id); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
