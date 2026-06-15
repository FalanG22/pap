"use client";

import { cn } from "@/lib/utils";

type PrevDiagnosis = {
  date: string;
  summary: string;
  category: string;
};

export function HistoryPanel({
  diagnoses,
  className,
}: {
  diagnoses: PrevDiagnosis[];
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card p-4", className)}>
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
        Historial clínico
      </h3>
      {diagnoses.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">Sin diagnósticos previos</p>
      ) : (
        <div className="space-y-2.5">
          {diagnoses.map((dx) => (
            <div key={dx.date} className="border-l-2 border-primary/20 pl-3 py-1">
              <p className="text-xs text-muted-foreground font-mono">{dx.date}</p>
              <p className="text-sm font-medium mt-0.5">{dx.category}</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-2">{dx.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
