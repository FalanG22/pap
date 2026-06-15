"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Globe, Mail, Server, PenLine, Stamp, WandSparkles, Cloud, Send } from "lucide-react";
import { StampDesigner } from "@/components/settings/StampDesigner";
import { toast } from "sonner";

type Setting = { key: string; value: string };

type Tab = { id: string; label: string };

const TABS: Tab[] = [
  { id: 'general', label: 'General' },
  { id: 'smtp', label: 'SMTP' },
  { id: 'cloudflare', label: 'Cloudflare' },
  { id: 'firma', label: 'Firma y Sello' },
  { id: 'pdf', label: 'Visualización PDF' },
];

const GENERAL_KEYS = ['app_domain', 'from_email', 'from_name'];
const SMTP_KEYS = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure'];
const CF_KEY = 'cloudflare_worker_url';

const SETTINGS_META: Record<string, { label: string; description: string; icon: typeof Globe }> = {
  app_domain: { label: "Dominio de la app", description: "URL pública del sitio (ej: https://papdiagnostico.com)", icon: Globe },
  from_email: { label: "Email remitente", description: "Dirección desde la que se envían los correos", icon: Mail },
  from_name: { label: "Nombre remitente", description: "Nombre que aparece como remitente", icon: Server },
  smtp_host: { label: "Servidor SMTP", description: "Ej: smtp.gmail.com, smtp.sendgrid.net", icon: Server },
  smtp_port: { label: "Puerto SMTP", description: "Ej: 587 (STARTTLS), 465 (SSL)", icon: Server },
  smtp_user: { label: "Usuario SMTP", description: "Dirección de email o nombre de usuario", icon: Mail },
  smtp_pass: { label: "Contraseña SMTP", description: "Contraseña o App Password", icon: Mail },
  smtp_secure: { label: "SMTP seguro (SSL)", description: "Usar TLS/SSL en lugar de STARTTLS", icon: Server },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [tenantConfig, setTenantConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [showStampDesigner, setShowStampDesigner] = useState(false);
  const [tab, setTab] = useState('general');
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testingCf, setTestingCf] = useState(false);

  const load = async () => {
    try {
      const [sRes, tRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/tenant-config"),
      ]);
      if (sRes.ok) {
        const data: Setting[] = await sRes.json();
        const map: Record<string, string> = {};
        for (const s of data) map[s.key] = s.value;
        setSettings(map);
      }
      if (tRes.ok) setTenantConfig(await tRes.json());
    } catch { toast.error("Error de conexión") }
    finally { setLoading(false) }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const allKeys = [...GENERAL_KEYS, ...SMTP_KEYS, CF_KEY];
      const updates = allKeys.map((key) => ({
        key,
        value: settings[key] || "",
      }));

      const [sRes, tRes] = await Promise.all([
        fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
        }),
        fetch("/api/tenant-config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tenantConfig),
        }),
      ]);

      if (!sRes.ok || !tRes.ok) { toast.error("Error al guardar"); return; }
      toast.success("Configuración guardada");
    } catch { toast.error("Error de conexión") }
    finally { setSaving(false) }
  };

  const handleUpload = async (file: File, type: "signature" | "stamp") => {
    const setUploading = type === "signature" ? setUploadingSig : setUploadingStamp;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error"); return; }

      const { url } = await res.json();
      setTenantConfig(prev => ({ ...prev, [`${type}_url`]: url }));
      toast.success(`${type === "signature" ? "Firma" : "Sello"} subido`);
    } catch { toast.error("Error de conexión") }
    finally { setUploading(false) }
  };

  const handleTest = async (method: 'smtp' | 'cloudflare') => {
    const setTesting = method === 'smtp' ? setTestingSmtp : setTestingCf;
    setTesting(true);
    try {
      const res = await fetch("/api/users/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      })
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error"); return; }
      toast.success(`Email de prueba enviado a ${data.to}`);
    } catch { toast.error("Error de conexión") }
    finally { setTesting(false) }
  };

  const renderField = (key: string, meta: { label: string; description: string; icon: typeof Globe }) => {
    const Icon = meta.icon;
    const isPassword = key === 'smtp_pass';
    const isSecure = key === 'smtp_secure';
    return (
      <div key={key} className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm">{meta.label}</h3>
            <p className="text-xs text-muted-foreground">{meta.description}</p>
          </div>
        </div>
        {isSecure ? (
          <label className="flex items-center gap-3 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={settings[key] === 'true'}
              onChange={(e) => setSettings(prev => ({ ...prev, [key]: e.target.checked ? 'true' : 'false' }))}
              className="rounded border-border w-4 h-4"
            />
            <span className="text-sm text-muted-foreground">Usar conexión SSL/TLS segura</span>
          </label>
        ) : (
          <Input
            type={isPassword ? 'password' : 'text'}
            value={settings[key] || ""}
            onChange={(e) => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder={meta.label}
            className="h-10"
          />
        )}
      </div>
    );
  };

  return (
    <div className="px-6 py-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Configuración</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ajustes del sistema</p>
        </div>
        <Button onClick={handleSave} disabled={saving || loading} className="gap-1.5">
          <Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-px">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.id
                ? 'bg-card border border-border border-b-white text-foreground -mb-px'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tab: General */}
          {tab === 'general' && GENERAL_KEYS.map(k => renderField(k, SETTINGS_META[k]))}

          {/* Tab: SMTP */}
          {tab === 'smtp' && (
            <>
              {SMTP_KEYS.map(k => renderField(k, SETTINGS_META[k]))}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => handleTest('smtp')}
                  disabled={testingSmtp}
                >
                  <Send className="w-4 h-4" />
                  {testingSmtp ? "Enviando..." : "Enviar email de prueba"}
                </Button>
                <p className="text-xs text-muted-foreground">Se enviará un email de prueba al usuario administrador</p>
              </div>
            </>
          )}

          {/* Tab: Cloudflare */}
          {tab === 'cloudflare' && (
            <>
              <div className="rounded-xl border border-dashed border-border/50 bg-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center">
                    <Cloud className="w-4 h-4 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">URL del Worker</h3>
                    <p className="text-xs text-muted-foreground">Si configurás una URL, se usará en lugar de SMTP</p>
                  </div>
                </div>
                <Input
                  value={settings.cloudflare_worker_url || ""}
                  onChange={(e) => setSettings(prev => ({ ...prev, cloudflare_worker_url: e.target.value }))}
                  placeholder="https://enviar-email.tu-worker.workers.dev"
                  className="h-10"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => handleTest('cloudflare')}
                  disabled={testingCf || !settings.cloudflare_worker_url}
                >
                  <Send className="w-4 h-4" />
                  {testingCf ? "Enviando..." : "Enviar email de prueba"}
                </Button>
                <p className="text-xs text-muted-foreground">Se enviará un email de prueba al usuario administrador</p>
              </div>
            </>
          )}

          {/* Tab: Firma y Sello */}
          {tab === 'firma' && (
            <>
              <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center">
                    <PenLine className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Firma digital</h3>
                    <p className="text-xs text-muted-foreground">Imagen PNG de la firma (aparece en el PDF)</p>
                  </div>
                </div>
                {tenantConfig.signature_url && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <img src={tenantConfig.signature_url as string} alt="Firma" className="h-12 object-contain" />
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, "signature");
                    }}
                  />
                  <span className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-border text-sm hover:bg-accent transition-colors">
                    {uploadingSig ? "Subiendo..." : tenantConfig.signature_url ? "Reemplazar firma" : "Subir firma"}
                  </span>
                </label>
              </div>

              <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center">
                    <Stamp className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Sello</h3>
                    <p className="text-xs text-muted-foreground">Imagen PNG del sello del laboratorio (aparece en el PDF)</p>
                  </div>
                </div>
                {tenantConfig.stamp_url && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <img src={tenantConfig.stamp_url as string} alt="Sello" className="h-16 object-contain" />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file, "stamp");
                      }}
                    />
                    <span className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-border text-sm hover:bg-accent transition-colors">
                      {uploadingStamp ? "Subiendo..." : "Subir imagen"}
                    </span>
                  </label>
                  <button
                    onClick={() => setShowStampDesigner(true)}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-primary text-primary text-sm hover:bg-primary/5 transition-colors"
                  >
                    <WandSparkles className="w-3.5 h-3.5" /> Crear sello digital
                  </button>
                </div>

                {showStampDesigner && (
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <StampDesigner
                      onSave={async (dataUrl, size) => {
                        const blob = await (await fetch(dataUrl)).blob();
                        const file = new File([blob], "stamp-digital.png", { type: "image/png" });
                        await handleUpload(file, "stamp");
                        setTenantConfig(prev => ({ ...prev, stamp_size: size }));
                        setShowStampDesigner(false);
                      }}
                      onCancel={() => setShowStampDesigner(false)}
                      initialData={{
                        labName: settings.app_name || "PAP Diagnóstico",
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Tab: PDF */}
          {tab === 'pdf' && (
            <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
              <h3 className="font-medium text-sm">Visualización en el PDF</h3>
              <p className="text-xs text-muted-foreground">Seleccioná qué elementos aparecen al pie del informe</p>
              <div className="space-y-3 pt-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tenantConfig.show_signature !== false}
                    onChange={(e) => setTenantConfig(prev => ({ ...prev, show_signature: e.target.checked }))}
                    className="rounded border-border w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-medium">Mostrar firma</p>
                    <p className="text-xs text-muted-foreground">Incluye la imagen de la firma en el PDF</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tenantConfig.show_stamp !== false}
                    onChange={(e) => setTenantConfig(prev => ({ ...prev, show_stamp: e.target.checked }))}
                    className="rounded border-border w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-medium">Mostrar sello</p>
                    <p className="text-xs text-muted-foreground">Incluye la imagen del sello en el PDF</p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
