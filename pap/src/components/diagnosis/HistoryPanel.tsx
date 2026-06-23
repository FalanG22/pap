"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PrevDiagnosis = {
  date: string;
  summary: string;
  category: string;
  fullSummary: string;
  sampleQuality: string;
  signedAt: string;
};

export function HistoryPanel({
  diagnoses,
  className,
}: {
  diagnoses: PrevDiagnosis[];
  className?: string;
}) {
  const [selected, setSelected] = useState<PrevDiagnosis | null>(null);

  const qualityLabel: Record<string, string> = {
    adequate: "Adecuada",
    inadequate: "Inadecuada",
  };

  return (
    <>
      <div className={cn("rounded-xl border border-border/50 bg-card p-4", className)}>
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Historial clínico
        </h3>
        {diagnoses.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 italic">Sin diagnósticos previos</p>
        ) : (
          <div className="space-y-2.5">
            {diagnoses.map((dx, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(dx)}
                className="w-full text-left border-l-2 border-primary/20 pl-3 py-1.5 hover:border-primary hover:bg-primary/5 transition-colors rounded-r-lg cursor-pointer"
              >
                <p className="text-xs text-muted-foreground font-mono">{dx.date}</p>
                <p className="text-sm font-medium mt-0.5">{dx.category}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{selected?.category}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Fecha</p>
                  <p className="font-medium">{selected.signedAt || selected.date}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Muestra</p>
                  <p className="font-medium">{qualityLabel[selected.sampleQuality] || selected.sampleQuality || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Diagnóstico descriptivo</p>
                <div className="rounded-lg bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {selected.fullSummary || "—"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}