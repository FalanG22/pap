"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Check, ChevronDown } from "lucide-react";

type Props = {
  items: string[];
  groups: { label: string; start: number; end: number }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function CategorySearchSelect({ items, groups, value, onChange, disabled, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query
    ? items
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => item.toLowerCase().includes(query.toLowerCase()))
    : items.map((item, idx) => ({ item, idx }));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`w-full flex items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-60 ${
          !value ? "text-muted-foreground" : ""
        }`}
      >
        <span className="truncate">{value || placeholder || "Seleccionar categoría..."}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 max-h-[320px] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="relative border-b border-border">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              placeholder="Buscar categoría..."
              className="w-full h-10 pl-9 pr-3 text-sm bg-transparent outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
            />
          </div>

          <div className="overflow-y-auto max-h-[260px]">
            {filtered.length === 0 ? (
              <p className="text-center py-4 text-xs text-muted-foreground">Sin resultados</p>
            ) : (
              filtered.map(({ item, idx }) => {
                const group = groups.find((g) => idx >= g.start && idx <= g.end);
                const isFirstInGroup = idx === 0 || groups.some((g) => g.end === idx - 1);
                const showGroup = group && !query && (idx === group.start);

                return (
                  <div key={idx}>
                    {showGroup && (
                      <div className="sticky top-0 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/80 backdrop-blur-sm border-b border-border/30">
                        {group.label}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => { onChange(item); setOpen(false); setQuery(""); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors ${
                        value === item ? "bg-primary/5 font-medium" : ""
                      }`}
                    >
                      <span className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center ${
                        value === item ? "border-primary bg-primary" : "border-border"
                      }`}>
                        {value === item && <Check className="w-3 h-3 text-primary-foreground" />}
                      </span>
                      <span className="truncate">{item}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
