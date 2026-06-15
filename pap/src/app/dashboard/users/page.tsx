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
import { Plus, User, Building2, Pencil, Trash2, Mail } from "lucide-react";
import { toast } from "sonner";

type Tenant = { id: string; name: string };
type TenantLink = { id: string; tenant_id: string; tenant_name: string; role: string };

type SystemUser = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  tenants: TenantLink[];
};

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  lab_admin: "Admin de Lab",
  viewer: "Solo ver",
};

const roleColor: Record<string, string> = {
  super_admin: "text-amber-600 bg-amber-50",
  lab_admin: "text-blue-600 bg-blue-50",
  viewer: "text-muted-foreground bg-muted",
};

export default function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [role, setRole] = useState("lab_admin");
  const [createdResult, setCreatedResult] = useState<Record<string, unknown> | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SystemUser | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = async () => {
    try {
      const [uRes, tRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/tenants"),
      ])
      if (uRes.ok) setUsers(await uRes.json())
      if (tRes.ok) setTenants(await tRes.json())
    } catch { toast.error("Error de conexión") }
    finally { setLoading(false) }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName || !tenantId) { toast.error("Completá todos los campos"); return; }
    setSubmitting(true);
    setCreatedResult(null);
    setSendError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: fullName, tenant_id: tenantId, role }),
      })
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Error"); return; }
      setCreatedResult(data);
    } catch { toast.error("Error de conexión") }
    finally { setSubmitting(false) }
  };

  const handleEdit = (u: SystemUser) => {
    setEditTarget(u);
    setEditEmail(u.email);
    setEditFullName(u.full_name);
    setEditActive(u.is_active);
    setConfirmDelete(null);
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editTarget.id, email: editEmail, full_name: editFullName, is_active: editActive }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error"); return; }
      toast.success("Usuario actualizado");
      setEditOpen(false);
      load();
    } catch { toast.error("Error de conexión") }
    finally { setSubmitting(false) }
  };

  const handleDelete = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Error"); return; }
      toast.success("Usuario eliminado");
      setEditOpen(false);
      setConfirmDelete(null);
      load();
    } catch { toast.error("Error de conexión") }
    finally { setSubmitting(false) }
  };

  const [sendError, setSendError] = useState<string | null>(null);

  const handleSendCredentials = async () => {
    if (!createdResult) return;
    setSendingEmail(true);
    setSendError(null);
    try {
      const res = await fetch("/api/users/send-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: createdResult.id,
          tenant_id: createdResult.tenant_id,
          password: createdResult.generated_password,
        }),
      })
      const data = await res.json();
      if (!res.ok) { setSendError(data.error || "Error al enviar email"); return; }
      setCreatedResult(prev => ({ ...prev, email_sent: true }));
      toast.success("Credenciales enviadas por email");
    } catch { setSendError("Error de conexión") }
    finally { setSendingEmail(false) }
  };

  return (
    <div className="px-6 py-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestioná los usuarios del sistema</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium cursor-pointer">
            <Plus className="w-4 h-4" /> Agregar usuario
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-heading">Agregar usuario al sistema</DialogTitle>
            </DialogHeader>
            {createdResult ? (
              <div className="space-y-4 pt-2">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm space-y-2">
                  <p className="font-medium text-emerald-800">✓ Usuario creado exitosamente</p>
                  <p className="text-emerald-700">{createdResult.email as string}</p>
                  {createdResult.email_sent ? (
                    <p className="text-emerald-600 text-xs flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Credenciales enviadas por email
                    </p>
                  ) : (
                    <>
                      <div className="border-t border-emerald-200 pt-2 mt-2">
                        <p className="text-xs text-emerald-700 mb-1">Contraseña generada:</p>
                        <code className="block text-center text-lg font-bold tracking-widest bg-white rounded-lg p-2 text-emerald-900 select-all">
                          {createdResult.generated_password as string}
                        </code>
                        <p className="text-xs text-emerald-600 mt-1">¿Querés enviar las credenciales por email?</p>
                      </div>
                      {createdResult.auth_error && (
                        <p className="text-amber-700 text-xs mt-1">{createdResult.auth_error as string}</p>
                      )}
                      {sendError && (
                        <p className="text-amber-700 text-xs mt-2">{sendError}</p>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {!createdResult.email_sent && (
                    <Button type="button" className="flex-1" onClick={handleSendCredentials} disabled={sendingEmail}>
                      {sendingEmail ? (
                        "Enviando..."
                      ) : (
                        <><Mail className="w-4 h-4" /> Enviar credenciales</>
                      )}
                    </Button>
                  )}
                  <Button type="button" variant="outline" className="flex-1" onClick={() => {
                    setCreatedResult(null);
                    setSendError(null);
                    setCreateOpen(false);
                    setEmail(""); setFullName(""); setTenantId(""); setRole("lab_admin");
                    load();
                  }}>
                    {createdResult.email_sent ? "Cerrar" : "Cerrar sin enviar"}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email *</label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="usuario@mail.com" className="h-10" autoFocus required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre completo *</label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Nombre Apellido" className="h-10" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Laboratorio *</label>
                  <select value={tenantId} onChange={e => setTenantId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" required>
                    <option value="">Seleccionar...</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rol</label>
                  <select value={role} onChange={e => setRole(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50">
                    <option value="lab_admin">Admin de Laboratorio</option>
                    <option value="viewer">Solo ver</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? "Agregando..." : "Agregar"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No hay usuarios registrados</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Agregá tu primer usuario para empezar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id}
              className="p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/30 transition-colors group cursor-pointer"
              onClick={() => handleEdit(u)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${u.is_active ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {u.tenants.map((t, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-muted">
                    <Building2 className="w-3 h-3" />
                    {t.tenant_name}
                    <span className={`px-1 rounded text-[10px] font-medium ${roleColor[t.role] || roleColor.viewer}`}>
                      {roleLabel[t.role] || t.role}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Editar usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
              <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="h-10" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nombre</label>
              <Input value={editFullName} onChange={e => setEditFullName(e.target.value)} className="h-10" required />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editActive} onChange={e => setEditActive(e.target.checked)}
                  className="rounded border-border" />
                Usuario activo
              </label>
            </div>
            {editTarget && (
              <div className="flex flex-wrap gap-1.5">
                {editTarget.tenants.map((t, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded text-xs ${roleColor[t.role]}`}>
                    {t.tenant_name} · {roleLabel[t.role]}
                  </span>
                ))}
              </div>
            )}
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
