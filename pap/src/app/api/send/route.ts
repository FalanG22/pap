import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'
import { renderResultEmail } from '@/lib/email-template'
import { sendEmail } from '@/lib/send-email'

export async function POST(request: Request) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { order_id, recipient_email } = await request.json()
  if (!order_id || !recipient_email) {
    return NextResponse.json({ error: 'order_id y recipient_email requeridos' }, { status: 400 })
  }

  const { data: order, error: orderErr } = await supabase
    .from('order')
    .select('*, patient:patient_id(*), diagnosis(*)')
    .eq('id', order_id)
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  const patient = order.patient
  const diagnosis = order.diagnosis?.[0]
  if (!diagnosis?.is_signed) {
    return NextResponse.json({ error: 'El diagnóstico aún no está firmado' }, { status: 400 })
  }

  const { data: lab } = await supabase
    .schema('_public')
    .from('tenants')
    .select('name, email')
    .eq('id', tenant.tenant_id)
    .single()

  const labName = lab?.name || 'Laboratorio'
  const labEmail = (lab as { email?: string } | undefined)?.email
  const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const accessToken = order.pdf_token
  const portalUrl = `${baseUrl}/portal/paciente`
  const labPortalUrl = labEmail ? `${baseUrl}/portal/lab` : undefined

  const html = renderResultEmail({
    labName,
    patientName: patient.full_name,
    patientDni: patient.dni,
    diagnosisDate: new Date(diagnosis.signed_at || order.created_at).toLocaleDateString('es-AR'),
    generalCategory: diagnosis.general_category || '—',
    portalUrl,
    accessToken,
    labPortalUrl,
  })

  const result = await sendEmail(supabase, {
    to: recipient_email,
    subject: `Resultado de PAP disponible — ${patient.full_name}`,
    html,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
