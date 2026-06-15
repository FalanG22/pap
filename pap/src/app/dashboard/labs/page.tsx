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
import { Plus, Building2, Pencil } from "lucide-react";
import { toast } from "sonner";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  email?: string;
  created_at: string;
  is_active: boolean;
};

export default function LabsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Tenant | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/tenants");
      if (res.ok) setTenants(await res.json());
      else toast.error("Error al cargar laboratorios");
    } catch { toast.error("Error de conexión"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTenants(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) { toast.error("Nombre y slug son requeridos"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error al crear"); return; }
      toast.success(`Laboratorio "${name}" creado`);
      setCreateOpen(false); setName(""); setSlug("");
      fetchTenants();
    } catch { toast.error("Error de conexión"); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (t: Tenant) => {
    setEditTarget(t);
    setEditName(t.name);
    setEditSlug(t.slug);
    setEditEmail(t.email || "");
    setEditActive(t.is_active);
    setConfirmDelete(null);
    setEditOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editName || !editSlug) { toast.error("Nombre y slug son requeridos"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editTarget.id, name: editName, slug: editSlug, email: editEmail || null, is_active: editActive }),
      });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error al guardar"); return; }
      toast.success("Laboratorio actualizado");
      setEditOpen(false);
      fetchTenants();
    } catch { toast.error("Error de conexión"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tenants?id=${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error al eliminar"); return; }
      toast.success("Laboratorio eliminado");
      setEditOpen(false);
      setConfirmDelete(null);
      fetchTenants();
    } catch { toast.error("Error de conexión"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Laboratorios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestioná los laboratorios del sistema</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium cursor-pointer">
            <Plus className="w-4 h-4" /> Nuevo laboratorio
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-heading">Nuevo laboratorio</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Laboratorio Central" className="h-10" autoFocus required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Slug *</label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="Ej: lab-central" className="h-10 font-mono text-sm" required />
                <p className="text-xs text-muted-foreground">Identificador único</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "Creando..." : "Crear"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No hay laboratorios registrados</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Creá tu primer laboratorio para empezar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tenants.map((t) => (
            <div key={t.id}
              className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/30 transition-colors group cursor-pointer"
              onClick={() => handleEdit(t)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <span className={`text-xs font-medium ${t.is_active ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {t.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Editar laboratorio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre *</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-10" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Slug *</label>
              <Input value={editSlug} onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="h-10 font-mono text-sm" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email de envío</label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                placeholder="resultados@laboratorio.com" className="h-10" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground cursor-pointer flex items-center gap-2">
                <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)}
                  className="rounded border-border" />
                Laboratorio activo
              </label>
            </div>
            {confirmDelete === editTarget?.id ? (
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
                <Button type="button" variant="destructive" className="flex-1" disabled={submitting} onClick={() => editTarget && handleDelete(editTarget.id)}>
                  {submitting ? "Eliminando..." : "Confirmar eliminación"}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(editTarget?.id || null)}>Eliminar</Button>
                <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "Guardando..." : "Guardar"}</Button>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
