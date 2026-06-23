"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  UserRound,
  Calendar,
  Mail,
  Phone,
  FileText,
  History,
  Download,
  CheckCircle2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type Patient = {
  id: string;
  dni: string;
  full_name: string;
  birth_date: string | null;
  sex: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

type Diagnosis = {
  id: string;
  sample_quality: string;
  general_category: string;
  descriptive_dx: string;
  is_signed: boolean;
  signed_at: string | null;
  created_at: string;
};

type Order = {
  id: string;
  status: string;
  pdf_token: string;
  created_at: string;
  updated_at: string;
  diagnosis: Diagnosis | null;
};

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En proceso",
  completed: "Completado",
  delivered: "Enviado",
};

const statusColor: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200/50",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200/50",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
};

const qualityLabel: Record<string, string> = {
  adequate: "Adecuada",
  inadequate: "Inadecuada",
};

const sexLabel: Record<string, string> = {
  female: "Femenino",
  male: "Masculino",
  other: "Otro",
};

export default function PatientDetailPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDx, setSelectedDx] = useState<{
    order: Order;
    diagnosis: Diagnosis;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/patients/${patientId}`);
        if (res.ok) {
          const data = await res.json();
          setPatient(data.patient);
          setOrders(data.orders || []);
        } else {
          toast.error("Error al cargar paciente");
          router.push("/dashboard/pacientes");
        }
      } catch {
        toast.error("Error de conexión");
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId, router]);

  const [now] = useState(() => Date.now());

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success("Código de acceso copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const signedCount = orders.filter(o => o.diagnosis?.is_signed).length;
  const totalCount = orders.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando paciente...</p>
        </div>
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/pacientes")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <UserRound className="w-5 h-5 text-primary" />
            <span className="font-heading font-bold">{patient.full_name}</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-5xl mx-auto space-y-6">
        {/* Patient info card */}
        <div className="rounded-xl border border-border/50 bg-card p-5 shadow-sm">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">DNI</p>
              <p className="font-medium font-mono">{patient.dni}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Edad / Sexo</p>
              <p className="font-medium">
                {patient.birth_date ? `${Math.floor((now - new Date(patient.birth_date).getTime()) / 31557600000)}a` : "—"}
                {patient.sex ? ` · ${sexLabel[patient.sex] || patient.sex}` : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                <Mail className="w-3 h-3 inline mr-1" />
                Email
              </p>
              <p className="font-medium truncate">{patient.email || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                <Phone className="w-3 h-3 inline mr-1" />
                Teléfono
              </p>
              <p className="font-medium">{patient.phone || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/30 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" /> {totalCount} orden{totalCount !== 1 ? "es" : ""}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {signedCount} firmado{signedCount !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Registrado desde {new Date(patient.created_at).toLocaleDateString("es-AR", { year: "numeric", month: "long" })}
            </span>
          </div>
        </div>

        {/* Portal access card */}
        {signedCount > 0 && (
          <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 to-primary/3 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ExternalLink className="w-4 h-4 text-primary" />
              <span className="text-sm font-heading font-semibold text-primary">Acceso al portal del paciente</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Compartí estos datos con el paciente para que pueda acceder a sus resultados:
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-card rounded-lg px-3 py-2 border border-border/50 text-sm">
                <span className="text-xs text-muted-foreground">DNI: </span>
                <span className="font-mono font-medium">{patient.dni}</span>
              </div>
              <div className="bg-card rounded-lg px-3 py-2 border border-border/50 text-sm">
                <span className="text-xs text-muted-foreground">Código: </span>
                <span className="font-mono font-medium">{orders.find(o => o.diagnosis?.is_signed)?.pdf_token?.slice(0, 8) || "—"}...</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg gap-1.5"
                onClick={() => {
                  const token = orders.find(o => o.diagnosis?.is_signed)?.pdf_token;
                  if (token) {
                    navigator.clipboard.writeText(
                      `Para consultar sus resultados ingrese a:\n\n` +
                      `${window.location.origin}/portal/paciente\n\n` +
                      `DNI: ${patient.dni}\n` +
                      `Código de acceso: ${token}`
                    );
                    toast.success("Datos de acceso copiados");
                  }
                }}
              >
                <Copy className="w-3.5 h-3.5" /> Copiar acceso
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg gap-1.5"
                onClick={() => window.open("/portal/paciente", "_blank")}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Ir al portal
              </Button>
            </div>
          </div>
        )}

        {/* Orders */}
        <div>
          <h2 className="text-sm font-heading font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <History className="w-4 h-4" />
            Historial de diagnósticos
            <span className="text-xs font-normal text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full">{totalCount}</span>
          </h2>

          {orders.length === 0 ? (
            <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No hay diagnósticos para este paciente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map(o => (
                <div
                  key={o.id}
                  className="rounded-xl border border-border/50 bg-card hover:shadow-sm hover:border-primary/20 transition-all p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-xs font-medium rounded-full ${statusColor[o.status] || ""}`}>
                          {statusLabel[o.status] || o.status}
                        </Badge>
                        {o.diagnosis?.is_signed && (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Firmado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("es-AR", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                        {" — "}
                        <span className="font-mono">#{o.id.slice(0, 6)}</span>
                      </p>
                      {o.diagnosis ? (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-medium">{o.diagnosis.general_category}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {o.diagnosis.descriptive_dx}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Muestra: {qualityLabel[o.diagnosis.sample_quality] || o.diagnosis.sample_quality}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground/60 italic mt-2">Sin diagnóstico</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {o.diagnosis && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="min-w-[44px] min-h-[44px]"
                          onClick={() => setSelectedDx({ order: o, diagnosis: o.diagnosis! })}
                          title="Ver detalle"
                        >
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                      {o.diagnosis?.is_signed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="min-w-[44px] min-h-[44px]"
                          onClick={() => window.open(`/api/pdf/${o.id}`, '_blank')}
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="min-w-[44px] min-h-[44px]"
                          onClick={() => router.push(`/dashboard/dx/${o.id}`)}
                          title="Abrir diagnóstico"
                        >
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </Button>
                    </div>
                  </div>

                  {/* Portal access info */}
                  {o.diagnosis?.is_signed && (
                    <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Acceso portal:</span>
                      <code className="text-[11px] bg-muted px-2 py-0.5 rounded font-mono">
                        {o.pdf_token.slice(0, 8)}...
                      </code>
                      <button
                        onClick={() => copyToken(o.pdf_token)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Copiar código de acceso"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Diagnosis detail dialog */}
      <Dialog open={!!selectedDx} onOpenChange={() => setSelectedDx(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{selectedDx?.diagnosis.general_category}</DialogTitle>
          </DialogHeader>
          {selectedDx && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Fecha</p>
                  <p className="font-medium">
                    {selectedDx.diagnosis.signed_at
                      ? new Date(selectedDx.diagnosis.signed_at).toLocaleDateString("es-AR", {
                          day: "numeric", month: "long", year: "numeric",
                        })
                      : new Date(selectedDx.diagnosis.created_at).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Estado</p>
                  <Badge variant="outline" className={`text-xs font-medium rounded-full ${statusColor[selectedDx.order.status] || ""}`}>
                    {statusLabel[selectedDx.order.status] || selectedDx.order.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Muestra</p>
                  <p className="font-medium">{qualityLabel[selectedDx.diagnosis.sample_quality] || selectedDx.diagnosis.sample_quality}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Firmado</p>
                  <p className="font-medium flex items-center gap-1">
                    {selectedDx.diagnosis.is_signed ? (
                      <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Sí</>
                    ) : "No"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Diagnóstico descriptivo</p>
                <div className="rounded-lg bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedDx.diagnosis.descriptive_dx || "—"}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg gap-1.5"
                  onClick={() => router.push(`/dashboard/dx/${selectedDx.order.id}`)}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir diagnóstico
                </Button>
                {selectedDx.diagnosis.is_signed && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg gap-1.5"
                    onClick={() => window.open(`/api/pdf/${selectedDx.order.id}`, '_blank')}
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
