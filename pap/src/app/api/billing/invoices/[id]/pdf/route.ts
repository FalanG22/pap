import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'
import { generateInvoicePdfBuffer } from '@/lib/generate-invoice-pdf'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { id } = await params

  const { data: invoice } = await supabase
    .from('invoice')
    .select('*')
    .eq('id', id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
  if (tenant.role !== 'super_admin' && invoice.tenant_id !== tenant.tenant_id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data: labData } = await supabase
    .schema('_public')
    .from('tenants')
    .select('name')
    .eq('id', invoice.tenant_id)
    .maybeSingle()

  const labName = (labData as unknown as { name?: string })?.name || 'Laboratorio'

  // Parse AFIP data from notes if present
  let afipData = null
  if (invoice.notes) {
    try {
      const parsed = typeof invoice.notes === 'string' ? JSON.parse(invoice.notes) : invoice.notes
      if (parsed.afip) afipData = parsed.afip
    } catch { /* not JSON or no afip key */ }
  }

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

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="factura-${invoice.invoice_number}.pdf"`,
    },
  })
}
