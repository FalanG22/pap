"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Download, FileText, History, ArrowLeft, Shield } from "lucide-react";

type Diagnosis = {
  order_id: string;
  date: string;
  status: string;
  category: string | null;
  descriptive_dx: string | null;
  is_signed: boolean;
  signed_at: string | null;
};

type PortalData = {
  patient_name: string;
  patient_dni: string;
  diagnoses: Diagnosis[];
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

export default function PatientPortalPage() {
  const [dni, setDni] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni || !token) return;
    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni: dni.replace(/\./g, ""), token }),
      });

      if (res.ok) {
        setData(await res.json());
      } else {
        const err = await res.json();
        setError(err.error || "No se encontraron resultados");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const latestSigned = data?.diagnoses.find(d => d.is_signed);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto flex items-center justify-center h-14 px-4 relative">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-heading font-bold text-xs">
              P
            </div>
            <span className="text-sm font-heading font-bold tracking-tight">PAP Diagnóstico</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 relative px-4 pt-10 sm:pt-14 pb-12">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-background to-surface" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-[120px]" />

        <div className="relative max-w-lg mx-auto space-y-6">
          {!data ? (
            <>
              <div className="text-center mb-2">
                <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-heading font-bold tracking-tight">Consultá tus resultados</h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Ingresá los datos de tu orden de atención para acceder
                </p>
              </div>

              <Card className="border border-border/50 shadow-sm bg-card">
                <CardContent className="pt-5 space-y-5">
                  <form onSubmit={handleSearch} className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="dni" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        DNI
                      </label>
                      <Input
                        id="dni"
                        placeholder="12.345.678"
                        value={dni}
                        onChange={(e) => setDni(e.target.value)}
                        className="h-11 text-center text-lg tracking-wider"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="token" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Código de acceso
                      </label>
                      <Input
                        id="token"
                        placeholder="ABC123XY"
                        value={token}
                        onChange={(e) => setToken(e.target.value.toUpperCase())}
                        className="h-11 text-center text-lg tracking-widest font-mono"
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 rounded-xl gap-2" disabled={loading}>
                      <Search className="w-4 h-4" /> {loading ? "Buscando..." : "Consultar resultados"}
                    </Button>
                  </form>

                  {error && (
                    <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
                      <p className="text-sm font-medium text-destructive">{error}</p>
                      <p className="text-xs text-muted-foreground mt-1">Verificá los datos e intentá de nuevo.</p>
                    </div>
                  )}

                  <p className="text-xs text-center text-muted-foreground">
                    ¿No tenés el código? Revisá tu correo o WhatsApp.
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <button
                onClick={() => setData(null)}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>

              <div className="space-y-4">
                {/* Patient card */}
                <div className="rounded-xl bg-card border border-border/50 p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-lg">{data.patient_name}</h2>
                      <p className="text-sm text-muted-foreground">DNI {data.patient_dni}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                    <History className="w-3 h-3" /> {data.diagnoses.length} resultado(s)
                  </p>
                </div>

                {data.diagnoses.length === 0 ? (
                  <div className="rounded-xl bg-card border border-border/50 p-8 text-center">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">No hay resultados disponibles</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground px-1">Resultados</h3>
                    {data.diagnoses.map((d) => (
                      <div key={d.order_id}
                        className="rounded-xl bg-card border border-border/50 p-4 shadow-sm hover:shadow-md hover:border-border transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge variant="outline" className={`text-xs font-medium rounded-full ${statusColor[d.status] || ""}`}>
                                {statusLabel[d.status] || d.status}
                              </Badge>
                              {d.is_signed && (
                                <span className="text-xs text-emerald-600 font-medium">Firmado</span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {d.category || "Sin categoría"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(d.date).toLocaleDateString("es-AR", {
                                day: "numeric", month: "long", year: "numeric",
                              })}
                            </p>
                            {d.descriptive_dx && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                                {d.descriptive_dx}
                              </p>
                            )}
                          </div>
                          {d.is_signed && (
                            <a
                              href={`/api/pdf/${d.order_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center hover:bg-primary/15 transition-all hover:scale-105"
                            >
                              <Download className="w-4 h-4 text-primary" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {latestSigned && (
                  <a href={`/api/pdf/${latestSigned.order_id}`} target="_blank" rel="noopener noreferrer"
                    className="block rounded-xl bg-gradient-to-br from-primary/5 to-primary/3 border border-primary/15 p-4 hover:from-primary/10 hover:to-primary/5 transition-all no-underline"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium text-primary">Último resultado firmado</p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      {latestSigned.category} &mdash; {new Date(latestSigned.signed_at!).toLocaleDateString("es-AR")}
                    </p>
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/30">
        PAP Diagnóstico &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
