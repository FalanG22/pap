"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Globe, FileKey, ArrowLeft, Loader2, CheckCircle2, XCircle,
  AlertCircle, Eye, EyeOff, Upload, Zap, Building2, Receipt,
} from "lucide-react";
import { toast } from "sonner";
import type { AfipConfig } from "@/types";

export default function AfipConfigPage() {
  const [config, setConfig] = useState<AfipConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [labs, setLabs] = useState<{ id: string; name: string }[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

  // Form
  const [cuit, setCuit] = useState("");
  const [environment, setEnvironment] = useState<"homologacion" | "produccion">("homologacion");
  const [puntoVenta, setPuntoVenta] = useState("1");
  const [isActive, setIsActive] = useState(false);

  // Certificados file upload
  const [certCrtFile, setCertCrtFile] = useState<File | null>(null);
  const [certKeyFile, setCertKeyFile] = useState<File | null>(null);
  const [certKeyPass, setCertKeyPass] = useState("");

  const [crtContent, setCrtContent] = useState("");
  const [keyContent, setKeyContent] = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const meRes = await fetch("/api/me");
      const me = await meRes.json();
      const superAdmin = me.isSuperAdmin === true;
      setIsSuperAdmin(superAdmin);

      if (superAdmin) {
        const statsRes = await fetch("/api/billing/stats");
        if (statsRes.ok) {
          const stats = await statsRes.json();
          if (Array.isArray(stats)) {
            setLabs(stats.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
            if (stats.length > 0 && !selectedLabId) {
              setSelectedLabId(stats[0].id);
            }
          }
        }
      }

      if (superAdmin && selectedLabId) {
        await loadForLab(selectedLabId);
      } else {
        await loadForLab(null);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function switchLab(id: string) {
    setSelectedLabId(id);
    setLoading(true);
    setTestResult(null);
    await loadForLab(id);
    setLoading(false);
  }

  async function loadForLab(labId: string | null) {
    try {
      const params = labId ? `?tenant_id=${labId}` : "";
      const res = await fetch(`/api/afip/config${params}`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        if (data) {
          setCuit(data.cuit || "");
          setEnvironment(data.environment || "homologacion");
          setPuntoVenta(String(data.punto_venta || 1));
          setIsActive(data.is_active || false);
          setCrtContent(data.certificate_crt || "");
          setKeyContent(data.certificate_key || "");
          setCertKeyPass(data.certificate_key_pass || "");
        } else {
          setCuit("");
          setEnvironment("homologacion");
          setPuntoVenta("1");
          setIsActive(false);
          setCrtContent("");
          setKeyContent("");
          setCertKeyPass("");
          setCertCrtFile(null);
          setCertKeyFile(null);
        }
      }
    } catch { /* silent */ }
  }

  function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  async function handleCrtFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      setCrtContent(text);
      setCertCrtFile(file);
      toast.success("Certificado .crt cargado");
    } catch { toast.error("Error al leer el archivo .crt"); }
  }

  async function handleKeyFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      setKeyContent(text);
      setCertKeyFile(file);
      toast.success("Clave privada .key cargada");
    } catch { toast.error("Error al leer el archivo .key"); }
  }

  async function save() {
    if (!cuit || cuit.length < 11) { toast.error("CUIT inválido (debe tener 11 dígitos)"); return; }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        cuit,
        environment,
        punto_venta: parseInt(puntoVenta) || 1,
        is_active: isActive,
      }
      if (crtContent) body.certificate_crt = crtContent
      if (keyContent) body.certificate_key = keyContent
      if (certKeyPass) body.certificate_key_pass = certKeyPass
      if (isSuperAdmin && selectedLabId) body.tenant_id = selectedLabId

      const res = await fetch("/api/afip/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error al guardar"); return; }
      toast.success("Configuración AFIP guardada");
      if (selectedLabId) loadForLab(selectedLabId);
    } catch { toast.error("Error de conexión"); }
    finally { setSaving(false); }
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const params = isSuperAdmin && selectedLabId ? `?tenant_id=${selectedLabId}` : "";
      const res = await fetch(`/api/afip/test${params}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error en la prueba"); setTestResult({ error: data.error }); return; }
      setTestResult(data);
      toast.success(data.message || "Prueba exitosa");
    } catch { toast.error("Error de conexión"); setTestResult({ error: "Error de conexión" }); }
    finally { setTesting(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  const hasCerts = !!(crtContent && keyContent);

  return (
    <div className="min-h-screen">
      <div className="px-6 py-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">AFIP — Factura Electrónica</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configuración de certificados y conexión con AFIP</p>
          </div>
        </div>

        {/* Selector de Doctor (solo super_admin) */}
        {isSuperAdmin && labs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Doctor:</span>
            <select
              value={selectedLabId || ""}
              onChange={e => switchLab(e.target.value)}
              className="h-9 rounded-xl border border-border/50 bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 min-w-[200px]"
            >
              {labs.map(lab => (
                <option key={lab.id} value={lab.id}>{lab.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Estado actual */}
        <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">Estado de la integración</span>
            </div>
            <Badge variant={config?.is_active ? "default" : "secondary"}>
              {config?.is_active ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">CUIT</p>
              <p className="font-medium font-mono">{config?.cuit || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Ambiente</p>
              <p className="font-medium">{config?.environment === "produccion" ? "Producción" : config?.environment === "homologacion" ? "Homologación" : "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Punto de venta</p>
              <p className="font-medium">{config?.punto_venta || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs">Certificado</p>
              <p className="font-medium">{config?.certificate_crt ? "✓ Cargado" : "✗ No cargado"}</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <div className="px-5 py-4 bg-muted/30 border-b border-border/30 flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Datos fiscales</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">CUIT</label>
                <Input placeholder="20333922907" value={cuit} onChange={e => setCuit(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  className="h-10 rounded-xl font-mono" maxLength={11} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ambiente</label>
                <select value={environment} onChange={e => setEnvironment(e.target.value as "homologacion" | "produccion")}
                  className="w-full h-10 rounded-xl border border-border/50 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  <option value="homologacion">Homologación (testing)</option>
                  <option value="produccion">Producción</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Punto de venta</label>
                <Input type="number" min="1" max="9999" value={puntoVenta} onChange={e => setPuntoVenta(e.target.value)}
                  className="h-10 rounded-xl font-mono" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-border/50 accent-primary" />
              <span className="text-sm">Facturación electrónica activa</span>
            </label>
          </div>
        </div>

        {/* Certificados */}
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <div className="px-5 py-4 bg-muted/30 border-b border-border/30 flex items-center gap-2">
            <FileKey className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Certificados electrónicos</span>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-xs text-muted-foreground">
              Cargá el certificado (.crt) y la clave privada (.key) emitidos por AFIP.
              {environment === "homologacion" ? (
                <span className="block mt-1 text-amber-600/80">
                  Usá los certificados de homologación de AFIP. Descargalos desde el portal de AFIP.
                </span>
              ) : (
                <span className="block mt-1 text-rose-600/80">
                  Estás en producción. Asegurate de usar los certificados reales.
                </span>
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Certificado (.crt) {crtContent ? <span className="text-emerald-600">✓</span> : ''}
                </label>
                <label className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">
                    {certCrtFile ? certCrtFile.name : "Seleccionar .crt"}
                  </span>
                  <input type="file" accept=".crt,.pem,.cer" className="hidden" onChange={handleCrtFile} />
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Clave privada (.key) {keyContent ? <span className="text-emerald-600">✓</span> : ''}
                </label>
                <label className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">
                    {certKeyFile ? certKeyFile.name : "Seleccionar .key"}
                  </span>
                  <input type="file" accept=".key,.pem" className="hidden" onChange={handleKeyFile} />
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Contraseña de la clave privada</label>
              <div className="relative">
                <Input type={showKey ? "text" : "password"} value={certKeyPass} onChange={e => setCertKeyPass(e.target.value)}
                  placeholder="Ingresá la passphrase del .key" className="h-10 rounded-xl pr-10 font-mono" />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {crtContent && (
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-[10px] font-mono text-muted-foreground break-all line-clamp-3">
                  {crtContent}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {crtContent.split('\n').length} líneas · {crtContent.includes('BEGIN CERTIFICATE') ? 'Formato PEM válido' : 'Formato no reconocido'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={save} disabled={saving} className="rounded-xl gap-1.5">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <ShieldCheck className="w-4 h-4" /> Guardar configuración AFIP
          </Button>
          <Button variant="outline" onClick={testConnection} disabled={testing || !hasCerts} className="rounded-xl gap-1.5">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {testing ? "Probando conexión..." : "Probar conexión con AFIP"}
          </Button>
        </div>

        {/* Resultado de prueba */}
        {testResult && (() => {
          const r = testResult as Record<string, unknown>;
          const success = r.success === true;
          const dummy = r.dummy as Record<string, string> | undefined;
          return (
            <div className={`rounded-2xl border p-5 space-y-3 ${success ? 'border-emerald-200/50 bg-emerald-50/30' : 'border-rose-200/50 bg-rose-50/30'}`}>
              <div className="flex items-center gap-2">
                {success ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                <span className={`font-semibold text-sm ${success ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {success ? 'Conexión exitosa' : 'Error de conexión'}
                </span>
              </div>
              {success && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Ambiente</p>
                    <p className="font-medium">{String(r.environment || '—')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">App Server</p>
                    <p className="font-medium font-mono text-xs">{dummy?.appServer || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">DB Server</p>
                    <p className="font-medium font-mono text-xs">{dummy?.dbServer || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Auth Server</p>
                    <p className="font-medium font-mono text-xs">{dummy?.authServer || '—'}</p>
                  </div>
                </div>
              )}
              {!!r.error && <p className="text-sm text-rose-700">{String(r.error)}</p>}
            </div>
          );
        })()}

        {/* Info de ambientes */}
        <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            Endpoints AFIP
          </h3>
          <div className="text-xs text-muted-foreground space-y-1 font-mono">
            <p><span className="font-medium text-foreground">WSAA:</span> {environment === 'homologacion' ? 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms' : 'https://wsaa.afip.gov.ar/ws/services/LoginCms'}</p>
            <p><span className="font-medium text-foreground">WSFEv1:</span> {environment === 'homologacion' ? 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx' : 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
