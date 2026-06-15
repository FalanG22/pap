"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Order = {
  id: string;
  patient_name: string;
  dni: string;
  lab: string;
  created_at: string;
  status: string;
};

const statusConfig: Record<string, { label: string; variant: "secondary" | "default" | "outline" | "destructive" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  in_progress: { label: "En proceso", variant: "default" },
  completed: { label: "Completado", variant: "outline" },
  delivered: { label: "Enviado", variant: "outline" },
};

export function OrderTable({
  orders,
  onSelect,
}: {
  orders: Order[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Orden</TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Paciente</TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wider text-muted-foreground hidden sm:table-cell">DNI</TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Lab</TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Recibido</TableHead>
            <TableHead className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Estado</TableHead>
            <TableHead className="text-right font-medium text-xs uppercase tracking-wider text-muted-foreground">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            return (
              <TableRow key={order.id} className="hover:bg-muted/20 transition-colors">
                <TableCell className="font-medium font-mono text-xs">#{order.id.slice(0, 6)}</TableCell>
                <TableCell className="font-medium">{order.patient_name}</TableCell>
                <TableCell className="text-muted-foreground hidden sm:table-cell">{order.dni}</TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">{order.lab}</TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">
                  {new Date(order.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant} className="font-medium text-xs">
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-primary hover:text-primary/80"
                    onClick={() => onSelect(order.id)}
                  >
                    Cargar Dx →
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                No hay órdenes pendientes
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
