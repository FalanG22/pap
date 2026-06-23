"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, UserRound, Calendar, Phone, Mail, ChevronRight } from "lucide-react";

type PatientRow = {
  id: string;
  dni: string;
  full_name: string;
  birth_date: string | null;
  sex: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/patients");
        if (res.ok) setPatients(await res.json());
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.dni.includes(search)
  );

  const [now] = useState(() => Date.now());

  const sexLabel: Record<string, string> = {
    female: "Femenino",
    male: "Masculino",
    other: "Otro",
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <UserRound className="w-5 h-5 text-primary" />
            <span className="font-heading font-bold">Pacientes</span>
            {!loading && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {patients.length}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-5xl mx-auto space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o DNI..."
            className="pl-9 h-10 rounded-xl bg-card border-border/50"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <UserRound className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">
              {search ? "No se encontraron pacientes" : "No hay pacientes registrados"}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {search ? "Intentá con otro término de búsqueda" : "Los pacientes se crean al generar una orden"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(p => (
              <div
                key={p.id}
                onClick={() => router.push(`/dashboard/pacientes/${p.id}`)}
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:shadow-sm hover:border-primary/20 transition-all cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{p.full_name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="font-mono">DNI: {p.dni}</span>
                    {p.birth_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {Math.floor((now - new Date(p.birth_date).getTime()) / 31557600000)}a
                      </span>
                    )}
                    {p.sex && <span>{sexLabel[p.sex] || p.sex}</span>}
                    {p.email && (
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <Mail className="w-3 h-3 shrink-0" />
                        {p.email}
                      </span>
                    )}
                    {p.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {p.phone}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
