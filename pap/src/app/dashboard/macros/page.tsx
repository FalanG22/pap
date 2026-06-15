"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FileText, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Macro = {
  id: string;
  shortcode: string;
  full_text: string;
  category: string;
  created_at: string;
};

const CATEGORY_OPTIONS = [
  "Bethesda",
  "Muestra",
  "Infección",
  "Inflamación",
  "Tratamiento",
  "Seguimiento",
  "Informe",
  "Personalizada",
];

export default function MacrosPage() {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [shortcode, setShortcode] = useState("");
  const [fullText, setFullText] = useState("");
  const [category, setCategory] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Macro | null>(null);
  const [editShortcode, setEditShortcode] = useState("");
  const [editFullText, setEditFullText] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/macros");
      if (res.ok) setMacros(await res.json());
    } catch { toast.error("Error de conexión") }
    finally { setLoading(false) }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortcode || !fullText) { toast.error("shortcode y texto son requeridos"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/macros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortcode, full_text: fullText, category }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error"); return; }
      toast.success("Macro creada");
      setCreateOpen(false); setShortcode(""); setFullText(""); setCategory("");
      load();
    } catch { toast.error("Error de conexión") }
    finally { setSubmitting(false) }
  };

  const handleEdit = (m: Macro) => {
    setEditTarget(m);
    setEditShortcode(m.shortcode.replace(/^\./, ""));
    setEditFullText(m.full_text);
    setEditCategory(m.category || "");
    setConfirmDelete(null);
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/macros", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editTarget.id, shortcode: editShortcode, full_text: editFullText, category: editCategory }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error"); return; }
      toast.success("Macro actualizada");
      setEditOpen(false);
      load();
    } catch { toast.error("Error de conexión") }
    finally { setSubmitting(false) }
  };

  const handleDelete = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/macros?id=${id}`, { method: "DELETE" })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error"); return; }
      toast.success("Macro eliminada");
      setEditOpen(false);
      setConfirmDelete(null);
      load();
    } catch { toast.error("Error de conexión") }
    finally { setSubmitting(false) }
  };

  const grouped = macros.reduce<Record<string, Macro[]>>((acc, m) => {
    const cat = m.category || "Sin categoría";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Macros</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Atajos de texto para diagnósticos rápidos</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium cursor-pointer">
            <Plus className="w-4 h-4" /> Crear macro
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Nueva macro</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Código (sin el .) *</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-mono">.</span>
                  <Input value={shortcode} onChange={e => setShortcode(e.target.value)}
                    placeholder="b2" className="h-10 font-mono" autoFocus required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Texto completo *</label>
                <textarea value={fullText} onChange={e => setFullText(e.target.value)}
                  placeholder="Sistema Bethesda: Negativo para lesión intraepitelial..."
                  className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring/50" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoría</label>
                <input list="categories" value={category} onChange={e => setCategory(e.target.value)}
                  placeholder="Bethesda, Muestra, etc."
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
                <datalist id="categories">
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? "Creando..." : "Crear macro"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : macros.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No hay macros</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Creá tu primera macro para agilizar diagnósticos</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">{cat}</h3>
              <div className="space-y-2">
                {items.map(m => (
                  <div key={m.id}
                    className="p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/30 transition-colors group cursor-pointer"
                    onClick={() => handleEdit(m)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs font-semibold text-primary bg-primary/8 px-1.5 py-0.5 rounded font-mono">
                            {m.shortcode}
                          </code>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{m.full_text}</p>
                      </div>
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Editar macro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Código</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-mono">.</span>
                <Input value={editShortcode} onChange={e => setEditShortcode(e.target.value)} className="h-10 font-mono" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Texto completo</label>
              <textarea value={editFullText} onChange={e => setEditFullText(e.target.value)}
                className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring/50" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoría</label>
              <input list="edit-categories" value={editCategory} onChange={e => setEditCategory(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
              <datalist id="edit-categories">
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            {confirmDelete === editTarget?.id ? (
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
                <Button type="button" variant="destructive" className="flex-1" disabled={submitting}
                  onClick={() => editTarget && handleDelete(editTarget.id)}>
                  {submitting ? "Eliminando..." : "Confirmar eliminación"}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(editTarget?.id || null)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
