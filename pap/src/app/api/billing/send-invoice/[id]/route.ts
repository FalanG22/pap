import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'
import { sendEmail } from '@/lib/send-email'
import { renderInvoiceEmail } from '@/lib/email-invoice'
import { generateInvoicePdfBuffer } from '@/lib/generate-invoice-pdf'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })
  if (tenant.role !== 'super_admin' && tenant.role !== 'lab_admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params

  // Obtener factura
  const { data: invoice } = await supabase
    .from('invoice')
    .select('*')
    .eq('id', id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
  if (tenant.role !== 'super_admin' && invoice.tenant_id !== tenant.tenant_id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Obtener nombre y email del laboratorio
  const { data: labData } = await supabase
    .schema('_public')
    .from('tenants')
    .select('name, email')
    .eq('id', invoice.tenant_id)
    .maybeSingle()

  const labName = (labData as unknown as { name?: string })?.name || 'Laboratorio'
  const labEmail = (labData as unknown as { email?: string })?.email

  // Buscar billing_email en config
  const { data: config } = await supabase
    .schema('_public')
    .from('tenant_billing_config')
    .select('billing_email')
    .eq('tenant_id', invoice.tenant_id)
    .maybeSingle()

  const billingEmail = (config as unknown as { billing_email?: string })?.billing_email || labEmail
  if (!billingEmail) {
    return NextResponse.json({ error: 'El Doctor no tiene email configurado para facturación. Configurá el email en Costos > Configuración.' }, { status: 400 })
  }

  // Parsear datos AFIP para incluirlos en el PDF
  let afipData = null
  if (invoice.notes) {
    try {
      const parsed = typeof invoice.notes === 'string' ? JSON.parse(invoice.notes) : invoice.notes
      if (parsed.afip) afipData = parsed.afip
    } catch { /* ignore */ }
  }

  // Generar PDF adjunto
  const pdfBuffer = await generateInvoicePdfBuffer({
    labName,
    invoiceNumber: invoice.invoice_number,
    periodStart: new Date(invoice.period_start).toLocaleDateString('es-AR'),
    periodEnd: new Date(invoice.period_end).toLocaleDateString('es-AR'),
    totalDiagnoses: invoice.total_diagnoses,
    unitCost: Number(invoice.unit_cost),
    totalAmount: Number(invoice.total_amount),
    currency: 'ARS',
    status: invoice.status,
    createdAt: new Date(invoice.created_at).toLocaleDateString('es-AR'),
    afip: afipData,
  })

  const html = renderInvoiceEmail({
    labName,
    invoiceNumber: invoice.invoice_number,
    periodStart: new Date(invoice.period_start).toLocaleDateString('es-AR'),
    periodEnd: new Date(invoice.period_end).toLocaleDateString('es-AR'),
    totalDiagnoses: invoice.total_diagnoses,
    unitCost: Number(invoice.unit_cost),
    totalAmount: Number(invoice.total_amount),
    currency: 'ARS',
  })

  const result = await sendEmail(supabase, {
    to: billingEmail,
    subject: `Factura ${invoice.invoice_number} — ${labName}`,
    html,
    attachments: [{ filename: `factura-${invoice.invoice_number}.pdf`, content: Buffer.from(pdfBuffer) }],
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // Marcar como enviada (solo si estaba pendiente, reenvío no cambia estado)
  let updated = invoice
  if (invoice.status === 'pending') {
    const r = await supabase
      .from('invoice')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (!r.error && r.data) updated = r.data
  }

  return NextResponse.json({ success: true, invoice: updated })
}
