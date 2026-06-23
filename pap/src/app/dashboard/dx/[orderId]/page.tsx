"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MacroInput } from "@/components/diagnosis/MacroInput";
import { HistoryPanel } from "@/components/diagnosis/HistoryPanel";
import { CategorySearchSelect } from "@/components/diagnosis/CategorySearchSelect";
import { ArrowLeft, Save, Send, Download, User, FileText, Calendar, CheckCircle2, Clock, Zap, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";

const SAMPLE_QUALITY_OPTIONS = [
  { value: "adequate", label: "Adecuada" },
  { value: "inadequate", label: "Inadecuada" },
];

const CATEGORIES = [
  "Negativo para lesión intraepitelial o malignidad (NILM)",
  "Infección: Trichomonas vaginalis",
  "Infección: Candida spp.",
  "Infección: Cambios celulares compatibles con virus herpes simple",
  "Infección: Actinomyces spp.",
  "Infección: Cambios celulares sugestivos de VPH",
  "Cambios celulares reactivos: Inflamación",
  "Cambios celulares reactivos: Reparación",
  "Cambios celulares reactivos: Radiación",
  "Cambios celulares reactivos: Dispositivo intrauterino (DIU)",
  "Cambios celulares reactivos: Atrofia con inflamación",
  "ASC-US: Células escamosas atípicas de significado indeterminado",
  "ASC-H: Células escamosas atípicas, no puede excluirse HSIL",
  "LSIL: Lesión intraepitelial escamosa de bajo grado (VPH/NIC I)",
  "HSIL: Lesión intraepitelial escamosa de alto grado (NIC II/NIC III)",
  "Carcinoma escamocelular",
  "AGC: Células glandulares atípicas NOS",
  "AGC: Células glandulares atípicas, favor neoplásico",
  "AIS: Adenocarcinoma in situ endocervical",
  "Adenocarcinoma: Endocervical",
  "Adenocarcinoma: Endometrial",
  "Adenocarcinoma: Extrauterino",
  "Adenocarcinoma: NOS",
  "Células endometriales en mujer ≥45 años",
  "Otros neoplasmas malignos",
  "Muestra adecuada para evaluación",
  "Muestra limitada por escasa celularidad",
  "Muestra limitada por hemorragia",
  "Muestra limitada por inflamación",
  "Muestra limitada por falta de celularidad endocervical",
  "Muestra rechazada / no procesada",
];

const CATEGORY_GROUPS = [
  { label: "Negativo (NILM)", start: 0, end: 0 },
  { label: "Microorganismos", start: 1, end: 5 },
  { label: "Cambios reactivos", start: 6, end: 10 },
  { label: "Escamosas", start: 11, end: 15 },
  { label: "Glandulares", start: 16, end: 22 },
  { label: "Otros", start: 23, end: 24 },
  { label: "Muestra", start: 25, end: 31 },
];

const CUSTOM_CATEGORIES_KEY = "pap:custom-dx-categories";

export default function DiagnosisPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sampleQuality, setSampleQuality] = useState("adequate");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [diagnosis, setDiagnosis] = useState("");
  const [isSigned, setIsSigned] = useState(false);
  const [patientName, setPatientName] = useState("—");
  const [patientDni, setPatientDni] = useState("—");
  const [patientInfo, setPatientInfo] = useState({ age: "—", sex: "—", email: "—" });
  const [history, setHistory] = useState<{ date: string; summary: string; category: string; fullSummary: string; sampleQuality: string; signedAt: string }[]>([]);
  const [downloadedAt, setDownloadedAt] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [orderStatus, setOrderStatus] = useState("pending");
  const [scheduleMode, setScheduleMode] = useState("manual");
  const [customDates, setCustomDates] = useState<number[]>([]);
  const [scheduleLoaded] = useState(false);
  const isLocked = isSigned && (orderStatus === "delivered" || orderStatus === "completed");

  const [customQualityOptions, setCustomQualityOptions] = useState<{ value: string; label: string }[]>([]);
  const [showAddQuality, setShowAddQuality] = useState(false);
  const [newQualityLabel, setNewQualityLabel] = useState("");

  const allQualityOptions = [...SAMPLE_QUALITY_OPTIONS, ...customQualityOptions];

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch { return []; }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(customCategories));
  }, [customCategories]);

  const handleAddQualityOption = async () => {
    const label = newQualityLabel.trim();
    if (!label) return;
    const value = "custom_" + label.toLowerCase().replace(/[^a-z0-9]/g, "_");
    if (allQualityOptions.some(o => o.value === value)) {
      toast.error("Esa opción ya existe");
      return;
    }
    const newOption = { value, label };
    const updated = [...customQualityOptions, newOption];
    setCustomQualityOptions(updated);
    setNewQualityLabel("");
    setShowAddQuality(false);
    const res = await fetch("/api/tenant-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ custom_sample_quality_options: updated }),
    });
    if (!res.ok) toast.error("Error al guardar opción personalizada");
  };

  const handleRemoveQualityOption = async (value: string) => {
    const updated = customQualityOptions.filter(o => o.value !== value);
    setCustomQualityOptions(updated);
    if (sampleQuality === value) setSampleQuality("adequate");
    await fetch("/api/tenant-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ custom_sample_quality_options: updated }),
    });
  };

  const handleAddCategory = (newCat: string) => {
    setCustomCategories(prev => prev.includes(newCat) ? prev : [...prev, newCat]);
  };

  const loadSchedule = async () => {
    try {
      const res = await fetch(`/api/send-schedule?order_id=${orderId}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setScheduleMode(data.mode);
          setCustomDates(data.custom_dates || []);
        }
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/diagnosis/${orderId}`);
        if (!res.ok) { toast.error("Error al cargar"); return; }
        const data = await res.json();

        if (data.order && mounted) {
          const p = data.order.patient || null;
          if (p) {
            setPatientName(p.full_name);
            setPatientDni(p.dni);
            setPatientInfo({
              age: p.birth_date
                ? `${Math.floor((Date.now() - new Date(p.birth_date).getTime()) / 31557600000)}a`
                : "—",
              sex: p.sex === "female" ? "Femenino" : p.sex === "male" ? "Masculino" : "—",
              email: p.email || "—",
            });
          }
          setOrderStatus(data.order.status);
          setDownloadedAt(data.order.downloaded_at || null);
        }

        if (data.diagnosis && mounted) {
          setSampleQuality(data.diagnosis.sample_quality);
          setCategory(data.diagnosis.general_category);
          setDiagnosis(data.diagnosis.descriptive_dx);
          setIsSigned(data.diagnosis.is_signed);
        }

        if (data.history && mounted) {
          setHistory(
            data.history.map((h: Record<string, string>) => ({
              date: new Date(h.signed_at || h.created_at).toLocaleDateString("es-AR"),
              summary: h.descriptive_dx?.slice(0, 80) + "...",
              category: h.general_category,
              fullSummary: h.descriptive_dx || "",
              sampleQuality: h.sample_quality || "",
              signedAt: h.signed_at ? new Date(h.signed_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "",
            }))
          );
        }

        if (mounted) {
          loadSchedule();
          const configRes = await fetch("/api/tenant-config");
          if (configRes.ok) {
            const config = await configRes.json();
            if (config.custom_sample_quality_options) {
              setCustomQualityOptions(config.custom_sample_quality_options);
            }
          }
        }
      } catch {
        toast.error("Error de conexión");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [orderId]);

  const handleSave = async (throwOnError = false) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/diagnosis/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sample_quality: sampleQuality,
          general_category: category,
          descriptive_dx: diagnosis,
          macros_used: [],
        }),
      });
      if (res.ok) { toast.success("Borrador guardado"); return true; }
      const err = await res.json().catch(() => ({ error: "Error al guardar" }));
      toast.error(err.error);
      if (throwOnError) throw new Error(err.error);
      return false;
    } catch (e) {
      if (throwOnError) throw e;
      toast.error("Error de conexión");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveSchedule = async () => {
    const res = await fetch("/api/send-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, mode: scheduleMode, custom_dates: customDates }),
    });
    if (!res.ok) console.warn("Error al guardar schedule:", await res.text());
  };

  const handleSign = async () => {
    if (!diagnosis.trim()) {
      toast.error("Escribí el diagnóstico antes de firmar");
      return;
    }
    if (!(await handleSave())) return;
    setSaving(true);
    try {
      await saveSchedule();
      const res = await fetch(`/api/sign/${orderId}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setIsSigned(true);
        setOrderStatus(data.status || "completed");
        if (data.sent) {
          toast.success("Diagnóstico firmado y enviado al paciente");
        } else if (data.sendError) {
          toast.warning(`Firmado, pero el email NO se envió: ${data.sendError}`);
        } else if (data.status === "delivered") {
          toast.success("Firmado y listo para entregar");
        } else {
          toast.success("Diagnóstico firmado");
        }
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        toast.error(data.error || "Error al firmar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error al eliminar"); setDeleting(false); return; }
      toast.success("Orden eliminada");
      router.push("/dashboard");
    } catch {
      toast.error("Error de conexión");
      setDeleting(false);
    }
  };

  const allCategories = [...CATEGORIES, ...customCategories];
  const allGroups = customCategories.length > 0
    ? [...CATEGORY_GROUPS, { label: "Personalizadas", start: CATEGORIES.length, end: CATEGORIES.length + customCategories.length - 1 }]
    : CATEGORY_GROUPS;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando orden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-base">{patientName}</span>
              <Separator orientation="vertical" className="h-5" />
              <span className="text-sm text-muted-foreground font-mono">#{orderId.slice(0, 6)}</span>
            </div>
            <Badge variant={orderStatus === "completed" || orderStatus === "delivered" ? "outline" : "secondary"} className="text-xs">
              {orderStatus === "completed" ? "Completado" : orderStatus === "delivered" ? "Enviado" : "Pendiente"}
            </Badge>
            {isSigned && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Firmado
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="rounded-xl gap-1.5" onClick={() => window.open(`/api/pdf/${orderId}`, '_blank')}>
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => handleSave()} disabled={saving || isLocked}>
              <Save className="w-3.5 h-3.5" /> {saving ? "Guardando..." : "Borrador"}
            </Button>
            <Button
              size="sm"
              className="rounded-xl gap-1.5"
              onClick={handleSign}
              disabled={isLocked || saving}
            >
              <Send className="w-3.5 h-3.5" /> {isSigned ? "Firmado" : "Firmar y enviar"}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient info */}
            <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-heading font-semibold text-muted-foreground uppercase tracking-wider">
                <User className="w-4 h-4" /> Paciente
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Nombre</p>
                  <p className="font-medium">{patientName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">DNI</p>
                  <p className="font-medium font-mono">{patientDni}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Edad / Sexo</p>
                  <p className="font-medium">{patientInfo.age} · {patientInfo.sex}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="font-medium truncate">{patientInfo.email}</p>
                </div>
              </div>
            </div>

            {/* Sample quality */}
            <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 text-sm font-heading font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Calidad de la muestra
                </div>
                {!isLocked && (
                  <button
                    onClick={() => setShowAddQuality(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Agregar
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allQualityOptions.map((opt) => (
                  <div key={opt.value} className="relative group">
                    <button
                      onClick={() => !isLocked && setSampleQuality(opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        sampleQuality === opt.value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      } ${isLocked ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      {opt.label}
                    </button>
                    {customQualityOptions.some(o => o.value === opt.value) && !isLocked && (
                      <button
                        onClick={() => handleRemoveQualityOption(opt.value)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {showAddQuality && !isLocked && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    autoFocus
                    value={newQualityLabel}
                    onChange={e => setNewQualityLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleAddQualityOption(); if (e.key === "Escape") { setShowAddQuality(false); setNewQualityLabel(""); } }}
                    placeholder="Ej: Muestra limitada..."
                    className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                  <Button size="sm" className="h-9 rounded-lg" onClick={handleAddQualityOption}>Agregar</Button>
                  <Button size="sm" variant="ghost" className="h-9 rounded-lg" onClick={() => { setShowAddQuality(false); setNewQualityLabel(""); }}>Cancelar</Button>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-heading font-semibold text-muted-foreground uppercase tracking-wider">
                <Calendar className="w-4 h-4" /> Categoría general
              </div>
              <CategorySearchSelect
                items={allCategories}
                groups={allGroups}
                value={category}
                onChange={setCategory}
                disabled={isLocked}
                placeholder="Buscar categoría..."
                onCreate={handleAddCategory}
              />
            </div>

            {/* Macros quick insert */}
            {!isLocked && (
              <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-heading font-semibold text-muted-foreground uppercase tracking-wider">
                  <Zap className="w-4 h-4" /> Macros rápidas
                </div>
                <p className="text-xs text-muted-foreground">
                  Escribí <code className="bg-primary/8 text-primary px-1 rounded text-xs font-mono">.</code> en el diagnóstico o hacé clic en una macro:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[".b2", ".b3", ".b5", ".pap1", ".inf1"].map((code) => (
                    <button
                      key={code}
                      onClick={() => setDiagnosis((prev) => prev + (prev ? "\n" : "") + code + " ")}
                      className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-mono hover:bg-primary/10 transition-colors"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnosis text */}
            <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-heading font-semibold text-muted-foreground uppercase tracking-wider">
                <FileText className="w-4 h-4" /> Diagnóstico descriptivo
              </div>
              <MacroInput value={diagnosis} onChange={setDiagnosis} disabled={isLocked} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <HistoryPanel diagnoses={history} />

            <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Atajos
              </h3>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p><kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono border border-border">.</kbd> + código = macro</p>
                <p><kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono border border-border">↑↓</kbd> Navegar macros</p>
                <p><kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono border border-border">Enter</kbd> Seleccionar macro</p>
              </div>
            </div>

            {!isLocked && (
              <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Programar envío
                </h3>
                <select
                  value={scheduleMode}
                  onChange={(e) => { setScheduleMode(e.target.value); if (e.target.value === "weekly") setCustomDates([1, 3, 5]); }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  <option value="manual">Manual (sin programación)</option>
                  <option value="immediate">Automático al firmar</option>
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal (elegir días)</option>
                  <option value="biweekly">Cada 2 semanas</option>
                  <option value="monthly">Mensual</option>
                  <option value="custom_dates">Días específicos del mes</option>
                </select>

                {scheduleMode === "daily" && (
                  <p className="text-xs text-muted-foreground">Se envía todos los días</p>
                )}
                {scheduleMode === "weekly" && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Días de la semana</p>
                    <div className="flex flex-wrap gap-1">
                      {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            setCustomDates((prev) =>
                              prev.includes(i + 1) ? prev.filter((x) => x !== i + 1) : [...prev, i + 1].sort()
                            )
                          }
                          className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                            customDates.includes(i + 1)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {scheduleMode === "biweekly" && (
                  <p className="text-xs text-muted-foreground">Se envía cada 14 días desde la fecha de firma</p>
                )}
                {scheduleMode === "monthly" && (
                  <p className="text-xs text-muted-foreground">Se envía cada 30 días desde la fecha de firma</p>
                )}
                {scheduleMode === "custom_dates" && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Días del mes</p>
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() =>
                            setCustomDates((prev) =>
                              prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)
                            )
                          }
                          className={`min-w-[44px] min-h-[44px] text-xs rounded-md transition-colors ${
                            customDates.includes(d)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground">
                  {scheduleMode === "manual" && "El diagnóstico solo se enviará cuando lo hagas manualmente"}
                  {scheduleMode === "immediate" && "Se envía automáticamente al firmar el diagnóstico"}
                  {scheduleMode === "daily" && "Se envía automáticamente todos los días"}
                  {scheduleMode === "weekly" && "Se envía automáticamente los días seleccionados"}
                  {scheduleMode === "biweekly" && "Se envía automáticamente cada 2 semanas"}
                  {scheduleMode === "monthly" && "Se envía automáticamente cada mes"}
                  {scheduleMode === "custom_dates" && "Se envía automáticamente en las fechas seleccionadas"}
                </p>
              </div>
            )}

            {isSigned && (
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-800">
                    {isLocked ? "Firmado y enviado" : "Firmado — editando"}
                  </p>
                </div>
                <p className="text-xs text-emerald-700/70">
                  {isLocked
                    ? "PDF generado, notificaciones enviadas."
                    : "Volvé a firmar para enviar los cambios."}
                </p>
              </div>
            )}

            <div className="border-t border-border/40 pt-4">
              <Button variant={downloadedAt ? "outline" : "destructive"} size="sm" className="rounded-xl gap-1.5"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting || !!downloadedAt}
                title={downloadedAt ? "No se puede eliminar: ya fue descargado por el Doctor" : ""}
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar orden
              </Button>
              {downloadedAt && (
                <p className="text-xs text-muted-foreground mt-2">No se puede eliminar porque el Doctor ya descargó este diagnóstico.</p>
              )}
              {showDeleteConfirm && (
                <div className="mt-3 rounded-xl bg-destructive/5 border border-destructive/20 p-4 space-y-3">
                  <p className="text-sm font-medium text-destructive">¿Eliminar esta orden?</p>
                  <p className="text-xs text-muted-foreground">Esta acción no se puede deshacer. Se eliminarán el diagnóstico, el programador de envío y todos los datos asociados.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 rounded-lg text-xs"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                    >
                      Cancelar
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1 rounded-lg text-xs" disabled={deleting}
                      onClick={handleDelete}
                    >
                      {deleting ? "Eliminando..." : "Confirmar eliminación"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
