"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Receipt, CheckCircle2, Clock, Send, Plus,
  Loader2, FileText, Settings2, X, AlertCircle, Building2,
  ShieldCheck, User, Calendar, CheckSquare, Square,
} from "lucide-react";
import { toast } from "sonner";
import type { Invoice } from "@/types";

type LabBillingInfo = {
  id: string;
  name: string;
  slug: string;
  cost_per_diagnosis: number;
  currency?: string;
  billing_email?: string;
  is_billing_active: boolean;
  customer_doc_type?: number;
  customer_doc_number?: string;
  pending_diagnoses: number;
  pending: number;
  sent: number;
  paid: number;
  cancelled?: number;
  total_amount: number;
  pending_amount: number;
};

type BillableDiagnosis = {
  id: string;
  patient_name: string;
  patient_dni: string;
  general_category: string;
  sample_quality: string;
  signed_at: string | null;
  invoice_id: string | null;
  invoice_number: string | null;
  invoice_status: string | null;
};

const statusBadge: Record<string, { label: string; variant: "secondary" | "default" | "outline" | "destructive" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  sent: { label: "Enviada", variant: "default" },
  paid: { label: "Pagada", variant: "outline" },
  cancelled: { label: "Anulada", variant: "destructive" },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(amount);
}

export default function BillingPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [diagnoses, setDiagnoses] = useState<BillableDiagnosis[]>([]);
  const [labs, setLabs] = useState<LabBillingInfo[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showConfig, setShowConfig] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [emittingAfipId, setEmittingAfipId] = useState<string | null>(null);

  const [costInput, setCostInput] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingFreq, setBillingFreq] = useState("monthly");
  const [invoicePrefix, setInvoicePrefix] = useState("FAC-");
  const [isActive, setIsActive] = useState(false);
  const [customerDocType, setCustomerDocType] = useState("80");
  const [customerDocNumber, setCustomerDocNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [generating, setGenerating] = useState(false);

  const [activeView, setActiveView] = useState<"invoices" | "diagnoses">("invoices");
  const [selectedDxIds, setSelectedDxIds] = useState<Set<string>>(new Set());
  const [diagnosisFilter, setDiagnosisFilter] = useState<"all" | "pending" | "invoiced">("all");

  useEffect(() => { loadData(); }, []);

  const labId = selectedLabId;

  async function loadData() {
    setLoading(true);
    try {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();
      const superAdmin = meData.isSuperAdmin === true;
      setIsSuperAdmin(superAdmin);

      const statsRes = await fetch("/api/billing/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (superAdmin && Array.isArray(statsData)) {
          setLabs(statsData);
          if (!selectedLabId && statsData.length > 0) {
            setSelectedLabId(statsData[0].id);
          }
        }
      }

      const invRes = await fetch("/api/billing/invoices");
      if (invRes.ok) setInvoices(await invRes.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function loadLabData(targetLabId: string) {
    const [invRes, statsRes, dxRes] = await Promise.all([
      fetch(`/api/billing/invoices?tenant_id=${targetLabId}`),
      fetch("/api/billing/stats"),
      fetch(`/api/billing/diagnoses?tenant_id=${targetLabId}`),
    ]);
    if (invRes.ok) setInvoices(await invRes.json());
    if (statsRes.ok) {
      const statsData = await statsRes.json();
      if (Array.isArray(statsData)) setLabs(statsData);
    }
    if (dxRes.ok) {
      const dxData = await dxRes.json();
      setDiagnoses(dxData);
      setSelectedDxIds(new Set());
    }
  }

  async function switchLab(id: string) {
    setSelectedLabId(id);
    setLoading(true);
    await loadLabData(id);
    setLoading(false);
  }

  const selectedLab = labs.find(l => l.id === labId) || null;

  async function saveConfig() {
    if (isSuperAdmin && !labId) { toast.error("Seleccioná un Doctor"); return; }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        cost_per_diagnosis: parseFloat(costInput) || 0,
        billing_email: billingEmail,
        billing_frequency: billingFreq,
        invoice_prefix: invoicePrefix,
        is_active: isActive,
        customer_doc_type: parseInt(customerDocType) || 80,
        customer_doc_number: customerDocNumber,
      };
      if (isSuperAdmin) body.tenant_id = labId;

      const res = await fetch("/api/billing/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error al guardar"); return; }
      toast.success("Configuración guardada");
      setShowConfig(false);
      loadData();
    } catch { toast.error("Error de conexión"); }
    finally { setSaving(false); }
  }

  async function generateInvoice() {
    if (isSuperAdmin && !labId) { toast.error("Seleccioná un Doctor"); return; }
    setGenerating(true);
    try {
      const body: Record<string, string> = { period_start: periodStart, period_end: periodEnd };
      if (isSuperAdmin) body.tenant_id = labId!;

      const res = await fetch("/api/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error al generar"); return; }
      toast.success(`Factura ${data.invoice_number} generada para ${selectedLab?.name || ''}`);
      setShowGenerate(false);
      setPeriodStart("");
      setPeriodEnd("");
      if (labId) await loadLabData(labId);
      else await loadData();
    } catch { toast.error("Error de conexión"); }
    finally { setGenerating(false); }
  }

  async function generateInvoiceFromSelected() {
    const ids = Array.from(selectedDxIds);
    if (ids.length === 0) { toast.error("Seleccioná al menos un diagnóstico"); return; }
    if (isSuperAdmin && !labId) { toast.error("Seleccioná un Doctor"); return; }
    setGenerating(true);
    try {
      const body: Record<string, unknown> = { diagnosis_ids: ids };
      if (isSuperAdmin) body.tenant_id = labId!;

      const res = await fetch("/api/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error al generar"); return; }
      toast.success(`Factura ${data.invoice_number} generada — ${ids.length} diagnóstico(s) facturado(s)`);
      setSelectedDxIds(new Set());
      setActiveView("invoices");
      if (labId) await loadLabData(labId);
      else await loadData();
    } catch { toast.error("Error de conexión"); }
    finally { setGenerating(false); }
  }

  function toggleDxSelection(id: string) {
    setSelectedDxIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllDx() {
    const pending = diagnoses.filter(d => !d.invoice_id);
    const allSelected = pending.every(d => selectedDxIds.has(d.id));
    if (allSelected) {
      setSelectedDxIds(new Set());
    } else {
      setSelectedDxIds(new Set(pending.map(d => d.id)));
    }
  }

  async function sendInvoice(id: string) {
    setSendingId(id);
    try {
      const res = await fetch(`/api/billing/send-invoice/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error al enviar"); return; }
      toast.success("Factura enviada por email");
      if (labId) loadLabData(labId);
    } catch { toast.error("Error de conexión"); }
    finally { setSendingId(null); }
  }

  async function emitirAfip(id: string) {
    setEmittingAfipId(id);
    try {
      const res = await fetch(`/api/afip/emitir/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error AFIP"); return; }
      toast.success(`Factura emitida por AFIP — CAE: ${data.afip.cae}`);
      if (labId) loadLabData(labId);
    } catch { toast.error("Error de conexión"); }
    finally { setEmittingAfipId(null); }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/billing/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error"); return; }
      toast.success(`Factura ${status === 'paid' ? 'marcada como pagada' : status === 'cancelled' ? 'anulada' : 'actualizada'}`);
      if (labId) loadLabData(labId);
    } catch { toast.error("Error de conexión"); }
  }

  function openConfig(lab: LabBillingInfo | null) {
    if (!lab) {
      setCostInput("");
      setBillingEmail("");
      setBillingFreq("monthly");
      setInvoicePrefix("FAC-");
      setIsActive(false);
      setCustomerDocType("80");
      setCustomerDocNumber("");
    } else {
      setCostInput(String(lab.cost_per_diagnosis || ""));
      setBillingEmail(lab.billing_email || "");
      setBillingFreq("monthly");
      setInvoicePrefix("FAC-");
      setIsActive(lab.is_billing_active);
      setCustomerDocType(String(lab.customer_doc_type || 80));
      setCustomerDocNumber(lab.customer_doc_number || "");
    }
    setShowConfig(true);
  }

  const costPerDiagnosis = selectedLab?.cost_per_diagnosis || 0;
  const totalPending = selectedLab?.pending || 0;
  const totalSent = selectedLab?.sent || 0;
  const totalPaid = selectedLab?.paid || 0;
  const totalAmount = selectedLab?.total_amount || 0;
  const pendingAmount = selectedLab?.pending_amount || 0;

  const filtered = statusFilter === "all"
    ? invoices
    : invoices.filter(i => i.status === statusFilter);

  const filteredDiagnoses = diagnoses.filter(d => {
    if (diagnosisFilter === "pending") return !d.invoice_id;
    if (diagnosisFilter === "invoiced") return d.invoice_id;
    return true;
  });

  const pendingDxCount = diagnoses.filter(d => !d.invoice_id).length;

  return (
    <div className="min-h-screen">
      <div className="px-6 py-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">Facturación</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gestión de facturas por diagnóstico</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => router.push("/dashboard/facturacion/afip")}>
              <ShieldCheck className="w-4 h-4" /> AFIP
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => openConfig(selectedLab)}>
              <Settings2 className="w-4 h-4" /> Costos
            </Button>
            <Button size="sm" className="rounded-xl gap-1.5" onClick={() => {
              if (isSuperAdmin && !labId) { toast.error("Seleccioná un Doctor"); return; }
              if (!costPerDiagnosis || costPerDiagnosis === 0) {
                toast.error("Configurá el costo por diagnóstico primero");
                openConfig(selectedLab);
                return;
              }
              setShowGenerate(true);
            }}>
              <Plus className="w-4 h-4" /> Generar factura
            </Button>
          </div>
        </div>

        {/* Selector de Doctor (solo super_admin) */}
        {isSuperAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Doctor:</span>
            <select
              value={labId || ""}
              onChange={e => switchLab(e.target.value)}
              className="h-9 rounded-xl border border-border/50 bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 min-w-[200px]"
            >
              {labs.map(lab => (
                <option key={lab.id} value={lab.id}>
                  {lab.name} {lab.cost_per_diagnosis > 0 ? `($${lab.cost_per_diagnosis}/dx)` : "(sin costo)"}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Stats del lab seleccionado */}
        {selectedLab && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: "Dx pendientes", value: selectedLab.pending_diagnoses, amount: null, icon: Clock, color: "from-amber-400/20 to-amber-400/5", bar: "bg-amber-500", iconBg: "bg-gradient-to-br from-amber-50 to-amber-100", iconColor: "text-amber-600" },
              { label: "Pendientes", value: totalPending, amount: pendingAmount, icon: FileText, color: "from-orange-400/20 to-orange-400/5", bar: "bg-orange-500", iconBg: "bg-gradient-to-br from-orange-50 to-orange-100", iconColor: "text-orange-600" },
              { label: "Enviadas", value: totalSent, amount: 0, icon: Send, color: "from-blue-400/20 to-blue-400/5", bar: "bg-blue-500", iconBg: "bg-gradient-to-br from-blue-50 to-blue-100", iconColor: "text-blue-600" },
              { label: "Pagadas", value: totalPaid, amount: 0, icon: CheckCircle2, color: "from-emerald-400/20 to-emerald-400/5", bar: "bg-emerald-500", iconBg: "bg-gradient-to-br from-emerald-50 to-emerald-100", iconColor: "text-emerald-600" },
              { label: "Total facturado", value: invoices.length, amount: totalAmount, icon: DollarSign, color: "from-violet-400/20 to-violet-400/5", bar: "bg-violet-500", iconBg: "bg-gradient-to-br from-violet-50 to-violet-100", iconColor: "text-violet-600" },
            ].map(s => {
              const Icon = s.icon;
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
                    <div>
                      <span className="text-3xl font-bold font-heading tracking-tight tabular-nums">{s.value}</span>
                      {s.amount !== null && (s.amount > 0 || s.label === "Total facturado") && (
                        <p className="text-xs text-muted-foreground mt-1 font-medium tabular-nums">
                          {formatCurrency(s.amount)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isSuperAdmin && labs.length > 0 && !labId && (
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <p className="text-sm text-muted-foreground">Seleccioná un Doctor para ver sus facturas</p>
          </div>
        )}

        {selectedLab && costPerDiagnosis === 0 && (
          <div className="rounded-xl border border-amber-200/50 bg-amber-50/30 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">Costo por diagnóstico no configurado para {selectedLab.name}</p>
                <p className="text-xs text-amber-600/70">Configurá el costo en Costos para poder generar facturas</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 shrink-0" onClick={() => openConfig(selectedLab)}>
              <Settings2 className="w-4 h-4" /> Configurar
            </Button>
          </div>
        )}

        {/* Vista rápida de TODOS los laboratorios (super_admin) */}
        {isSuperAdmin && labs.length > 1 && (
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="px-4 py-3 bg-muted/30 border-b border-border/30">
              <p className="text-sm font-medium">Costos por Doctor</p>
            </div>
            <div className="divide-y divide-border/20">
              {labs.map(lab => (
                <div key={lab.id}
                  onClick={() => switchLab(lab.id)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{lab.name}</span>
                    {lab.pending_diagnoses > 0 && (
                      <span className="inline-flex items-center justify-center w-6 h-6 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">
                        {lab.pending_diagnoses}
                      </span>
                    )}
                    <Badge variant={lab.is_billing_active ? "default" : "secondary"} className="text-[10px]">
                      {lab.is_billing_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="tabular-nums font-medium">
                      {lab.cost_per_diagnosis > 0 ? formatCurrency(lab.cost_per_diagnosis) + "/dx" : "Sin configurar"}
                    </span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      <span className="font-semibold text-amber-600">{lab.pending_diagnoses}</span> dx sin facturar &middot; {lab.paid} pagadas &middot; {formatCurrency(lab.pending_amount)}
                    </span>
<Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]" onClick={e => { e.stopPropagation(); openConfig(lab); }}>
  <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main tabs: Facturas / Diagnósticos */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            <button onClick={() => setActiveView("invoices")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeView === "invoices" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Facturas
            </button>
            <button onClick={() => setActiveView("diagnoses")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeView === "diagnoses" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Diagnósticos
              {pendingDxCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">
                  {pendingDxCount}
                </span>
              )}
            </button>
          </div>

          {activeView === "invoices" && (
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {["all", "pending", "sent", "paid", "cancelled"].map(tab => (
                <button key={tab} onClick={() => setStatusFilter(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === tab ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {tab === "all" ? "Todas" : statusBadge[tab]?.label || tab}
                  <span className="opacity-60">({tab === "all" ? invoices.length : invoices.filter(i => i.status === tab).length})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ===== VISTA: DIAGNÓSTICOS ===== */}
        {activeView === "diagnoses" && selectedLab && (
          <div className="space-y-4">
            {/* Barra de acciones */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
                {[
                  { key: "all", label: "Todos" },
                  { key: "pending", label: "Pendientes" },
                  { key: "invoiced", label: "Facturados" },
                ].map(tab => (
                  <button key={tab.key} onClick={() => { setDiagnosisFilter(tab.key as typeof diagnosisFilter); setSelectedDxIds(new Set()); }}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      diagnosisFilter === tab.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    <span className="ml-1 opacity-60">
                      ({tab.key === "all" ? diagnoses.length : tab.key === "pending" ? pendingDxCount : diagnoses.length - pendingDxCount})
                    </span>
                  </button>
                ))}
              </div>

              {selectedDxIds.size > 0 && (
                <Button size="sm" className="rounded-xl gap-1.5" onClick={generateInvoiceFromSelected} disabled={generating}>
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  Facturar seleccionados ({selectedDxIds.size}) — {formatCurrency(selectedDxIds.size * costPerDiagnosis)}
                </Button>
              )}
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : filteredDiagnoses.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">
                  {diagnosisFilter === "pending" ? "No hay diagnósticos pendientes de facturación" :
                   diagnosisFilter === "invoiced" ? "No hay diagnósticos facturados" :
                   "No hay diagnósticos firmados"}
                </p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  Los diagnósticos firmados aparecen aquí para que puedas seleccionarlos y facturarlos
                </p>
              </div>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="rounded-xl border border-border/50 bg-card overflow-hidden md:hidden">
                  <div className="divide-y divide-border/20">
                    {filteredDiagnoses.map(dx => {
                      const isPending = !dx.invoice_id;
                      const isSelected = selectedDxIds.has(dx.id);
                      return (
                        <div key={dx.id}
                          className={`p-4 ${isSelected ? "bg-primary/5" : ""} ${isPending ? "cursor-pointer" : "opacity-60"}`}
                          onClick={() => isPending && toggleDxSelection(dx.id)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <button onClick={(e) => { e.stopPropagation(); isPending && toggleDxSelection(dx.id); }}
                                className="shrink-0 mt-0.5">
                                {isPending ? (
                                  isSelected
                                    ? <CheckSquare className="w-5 h-5 text-primary" />
                                    : <Square className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                )}
                              </button>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{dx.patient_name}</p>
                                <p className="text-xs text-muted-foreground font-mono mt-0.5">DNI {dx.patient_dni}</p>
                              </div>
                            </div>
                            <Badge variant={isPending ? "secondary" : "outline"} className="shrink-0">
                              {isPending ? "Pendiente" : `Facturado (${dx.invoice_number})`}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground ml-9">
                            {dx.general_category && (
                              <span>{dx.general_category}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {dx.signed_at ? new Date(dx.signed_at).toLocaleDateString("es-AR") : "—"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Desktop table */}
                <div className="hidden md:block rounded-xl border border-border/50 bg-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/30 bg-muted/30">
                          <th className="w-10 px-3 py-3 text-center">
                            <button onClick={toggleAllDx} className="hover:opacity-70 transition-opacity"
                              title="Seleccionar todos los pendientes">
                              {filteredDiagnoses.some(d => !d.invoice_id) ? (
                                filteredDiagnoses.filter(d => !d.invoice_id).every(d => selectedDxIds.has(d.id))
                                  ? <CheckSquare className="w-4 h-4 text-primary mx-auto" />
                                  : <Square className="w-4 h-4 text-muted-foreground mx-auto" />
                              ) : (
                                <Square className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                              )}
                            </button>
                          </th>
                          <th className="text-left px-3 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Paciente</th>
                          <th className="text-left px-3 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Categoría</th>
                          <th className="text-left px-3 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Firma</th>
                          <th className="text-center px-3 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {filteredDiagnoses.map(dx => {
                          const isPending = !dx.invoice_id;
                          const isSelected = selectedDxIds.has(dx.id);
                          return (
                            <tr key={dx.id}
                              className={`hover:bg-muted/20 transition-colors ${isSelected ? "bg-primary/5" : ""} ${!isPending ? "opacity-60" : "cursor-pointer"}`}
                              onClick={() => isPending && toggleDxSelection(dx.id)}
                            >
                              <td className="px-3 py-3 text-center">
                                {isPending ? (
                                  isSelected
                                    ? <CheckSquare className="w-4 h-4 text-primary mx-auto" />
                                    : <Square className="w-4 h-4 text-muted-foreground mx-auto" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                                )}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  <div>
                                    <span className="font-medium text-sm">{dx.patient_name}</span>
                                    <span className="text-[10px] text-muted-foreground ml-1.5">DNI {dx.patient_dni}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-xs text-muted-foreground">{dx.general_category}</td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  {dx.signed_at ? new Date(dx.signed_at).toLocaleDateString("es-AR") : "—"}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center">
                                {isPending ? (
                                  <Badge variant="secondary" className="text-[10px]">Pendiente</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50">
                                    Facturado ({dx.invoice_number})
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {diagnoses.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card p-4 flex flex-wrap items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  {diagnoses.length} diagnóstico{diagnoses.length !== 1 ? 's' : ''} — {selectedLab?.name}
                </span>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Pendientes: </span>
                    <span className="font-semibold text-amber-600 tabular-nums">{pendingDxCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Facturados: </span>
                    <span className="font-semibold text-emerald-600 tabular-nums">{diagnoses.length - pendingDxCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total a facturar: </span>
                    <span className="font-semibold tabular-nums">{formatCurrency(pendingDxCount * costPerDiagnosis)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== VISTA: FACTURAS ===== */}
        {activeView === "invoices" && (
          <>
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : !selectedLab ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Seleccioná un Doctor</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Elegí un Doctor para ver sus facturas</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No hay facturas para {selectedLab?.name}</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  {costPerDiagnosis > 0 ? "Generá la primera factura desde el botón 'Generar factura'" : "Configurá el costo por diagnóstico para empezar"}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="rounded-xl border border-border/50 bg-card overflow-hidden md:hidden">
                  <div className="divide-y divide-border/20">
                    {filtered.map(inv => {
                      const badge = statusBadge[inv.status] || { label: inv.status, variant: "secondary" };
                      let afipNum: string | null = null;
                      try {
                        const notes = typeof inv.notes === 'string' ? JSON.parse(inv.notes) : inv.notes;
                        if (notes?.afip?.comprobante_numero) {
                          afipNum = String(notes.afip.comprobante_numero).padStart(8, '0');
                        }
                      } catch { /* ignore */ }
                      return (
                        <div key={inv.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium font-mono text-sm">{inv.invoice_number}</p>
                              {afipNum && (
                                <p className="text-[10px] text-indigo-500 font-mono mt-0.5">AFIP: {afipNum}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(inv.period_start).toLocaleDateString("es-AR")} — {new Date(inv.period_end).toLocaleDateString("es-AR")}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-semibold tabular-nums">{formatCurrency(Number(inv.total_amount))}</p>
                              <Badge variant={badge.variant} className="mt-1">
                                {badge.label}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                            <span>{inv.total_diagnoses} diagnóstico{inv.total_diagnoses !== 1 ? 's' : ''} × {formatCurrency(Number(inv.unit_cost))}</span>
                            <span>{inv.sent_at ? new Date(inv.sent_at).toLocaleDateString("es-AR") : "No enviado"}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/20">
                            <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]"
                              onClick={() => window.open(`/api/billing/invoices/${inv.id}/pdf`, '_blank')}
                              title="Ver PDF"
                            >
                              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                            {inv.status === "pending" && (
                              <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]"
                                onClick={() => emitirAfip(inv.id)}
                                disabled={emittingAfipId === inv.id}
                                title="Emitir factura electrónica AFIP"
                              >
                                {emittingAfipId === inv.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                                }
                              </Button>
                            )}
                            {(inv.status === "pending" || inv.status === "sent") && (
                              <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]"
                                onClick={() => sendInvoice(inv.id)}
                                disabled={sendingId === inv.id}
                                title={inv.sent_at ? "Reenviar factura por email" : "Enviar factura por email"}
                              >
                                {sendingId === inv.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Send className="w-3.5 h-3.5 text-blue-500" />
                                }
                              </Button>
                            )}
                            {inv.status === "sent" && (
                              <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]"
                                onClick={() => updateStatus(inv.id, "paid")}
                                title="Marcar como pagada"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              </Button>
                            )}
                            {(inv.status === "pending" || inv.status === "sent") && (
                              <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]"
                                onClick={() => updateStatus(inv.id, "cancelled")}
                                title="Anular factura"
                              >
                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Desktop table */}
                <div className="hidden md:block rounded-xl border border-border/50 bg-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/30 bg-muted/30">
                          <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Factura</th>
                          <th className="text-left px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Período</th>
                          <th className="text-center px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Dx</th>
                          <th className="text-right px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Costo unit.</th>
                          <th className="text-right px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Total</th>
                          <th className="text-center px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Estado</th>
                          <th className="text-center px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Envío</th>
                          <th className="text-right px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {filtered.map(inv => {
                          const badge = statusBadge[inv.status] || { label: inv.status, variant: "secondary" };
                          let afipNum: string | null = null;
                          try {
                            const notes = typeof inv.notes === 'string' ? JSON.parse(inv.notes) : inv.notes;
                            if (notes?.afip?.comprobante_numero) {
                              afipNum = String(notes.afip.comprobante_numero).padStart(8, '0');
                            }
                          } catch { /* ignore */ }
                          return (
                            <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="font-medium font-mono text-xs">{inv.invoice_number}</span>
                                  {afipNum && (
                                    <span className="text-[9px] text-indigo-500 font-mono mt-0.5">AFIP: {afipNum}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {new Date(inv.period_start).toLocaleDateString("es-AR")} — {new Date(inv.period_end).toLocaleDateString("es-AR")}
                              </td>
                              <td className="px-4 py-3 text-center tabular-nums">{inv.total_diagnoses}</td>
                              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                {formatCurrency(Number(inv.unit_cost))}
                              </td>
                              <td className="px-4 py-3 text-right font-medium tabular-nums">
                                {formatCurrency(Number(inv.total_amount))}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant={badge.variant} className="text-[10px] px-2 py-0.5">
                                  {badge.label}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {inv.sent_at ? (
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(inv.sent_at).toLocaleDateString("es-AR")}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">—</span>
                                )}
                              </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]"
                                  onClick={() => window.open(`/api/billing/invoices/${inv.id}/pdf`, '_blank')}
                                  title="Ver PDF"
                                >
                                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                </Button>
                                {inv.status === "pending" && (
                                  <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]"
                                    onClick={() => emitirAfip(inv.id)}
                                    disabled={emittingAfipId === inv.id}
                                    title="Emitir factura electrónica AFIP"
                                  >
                                    {emittingAfipId === inv.id
                                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      : <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                                    }
                                  </Button>
                                )}
                                {(inv.status === "pending" || inv.status === "sent") && (
                                  <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]"
                                    onClick={() => sendInvoice(inv.id)}
                                    disabled={sendingId === inv.id}
                                    title={inv.sent_at ? "Reenviar factura por email" : "Enviar factura por email"}
                                  >
                                    {sendingId === inv.id
                                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      : <Send className="w-3.5 h-3.5 text-blue-500" />
                                    }
                                  </Button>
                                )}
                                {inv.status === "sent" && (
                                  <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]"
                                    onClick={() => updateStatus(inv.id, "paid")}
                                    title="Marcar como pagada"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  </Button>
                                )}
                                {(inv.status === "pending" || inv.status === "sent") && (
                                  <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]"
                                    onClick={() => updateStatus(inv.id, "cancelled")}
                                    title="Anular factura"
                                  >
                                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                                  </Button>
                                )}
                              </div>
                            </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {invoices.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-card p-4 flex flex-wrap items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  {invoices.length} factura{invoices.length !== 1 ? 's' : ''} — {selectedLab?.name}
                </span>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Pendiente: </span>
                    <span className="font-semibold text-amber-600 tabular-nums">{formatCurrency(pendingAmount)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-semibold tabular-nums">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Config Modal */}
      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowConfig(false)}>
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/30">
              <div>
                <h2 className="text-lg font-heading font-bold">Configuración de costos</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedLab ? selectedLab.name : "Costo por diagnóstico y datos de facturación"}
                </p>
              </div>
              <button onClick={() => setShowConfig(false)} className="min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Costo por diagnóstico ($)</label>
                <Input type="number" step="0.01" min="0" placeholder="Ej: 500" value={costInput} onChange={e => setCostInput(e.target.value)}
                  className="h-10 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email para facturación</label>
                <Input type="email" placeholder="facturacion@doctor.com" value={billingEmail} onChange={e => setBillingEmail(e.target.value)}
                  className="h-10 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Frecuencia de facturación</label>
                <select value={billingFreq} onChange={e => setBillingFreq(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border/50 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="monthly">Mensual</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prefijo de factura</label>
                <Input value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)}
                  className="h-10 rounded-xl font-mono" />
              </div>
              <div className="border-t border-border/20 pt-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">Datos del cliente (AFIP)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipo doc.</label>
                    <select value={customerDocType} onChange={e => setCustomerDocType(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border/50 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                    >
                      <option value="80">CUIT</option>
                      <option value="96">DNI</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">CUIT / DNI</label>
                    <Input placeholder="20-12345678-9" value={customerDocNumber} onChange={e => setCustomerDocNumber(e.target.value)}
                      className="h-10 rounded-xl font-mono" />
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-border/50 accent-primary" />
                <span className="text-sm">Facturación activa</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 px-6 pb-6 pt-2 border-t border-border/30">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowConfig(false)}>Cancelar</Button>
              <Button size="sm" className="rounded-xl gap-1.5" onClick={saveConfig} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowGenerate(false)}>
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/30">
              <div>
                <h2 className="text-lg font-heading font-bold">Generar factura por período</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedLab ? selectedLab.name : "Seleccioná el período a facturar"}
                </p>
              </div>
              <button onClick={() => setShowGenerate(false)} className="min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Se facturarán los <strong>diagnósticos firmados no facturados aún</strong> en el período seleccionado.
                <br />
                <span className="font-medium text-foreground">
                  {selectedLab?.name} — Costo por diagnóstico: {formatCurrency(costPerDiagnosis)}
                  {selectedLab?.pending_diagnoses !== undefined && (
                    <> &middot; <span className="text-amber-600">{selectedLab.pending_diagnoses} dx pendientes</span></>
                  )}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Desde</label>
                  <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
                    className="h-10 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Hasta</label>
                  <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
                    className="h-10 rounded-xl" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 pb-6 pt-2 border-t border-border/30">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowGenerate(false)}>Cancelar</Button>
              <Button size="sm" className="rounded-xl gap-1.5" onClick={generateInvoice} disabled={generating}>
                {generating && <Loader2 className="w-4 h-4 animate-spin" />}
                <FileText className="w-4 h-4" /> Generar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
