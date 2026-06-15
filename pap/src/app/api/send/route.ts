import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'
import { renderResultEmail } from '@/lib/email-template'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export async function POST(request: Request) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { order_id, recipient_email } = await request.json()
  if (!order_id || !recipient_email) {
    return NextResponse.json({ error: 'order_id y recipient_email requeridos' }, { status: 400 })
  }

  if (!resend) {
    return NextResponse.json({ error: 'Resend no configurado (falta RESEND_API_KEY)' }, { status: 500 })
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
    .select('name')
    .eq('id', tenant.tenant_id)
    .single()

  const labName = lab?.name || 'Laboratorio'
  const accessToken = order.pdf_token
  const portalUrl = `${request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/portal/paciente`

  const html = renderResultEmail({
    labName,
    patientName: patient.full_name,
    patientDni: patient.dni,
    diagnosisDate: new Date(diagnosis.signed_at || order.created_at).toLocaleDateString('es-AR'),
    generalCategory: diagnosis.general_category || '—',
    portalUrl,
    accessToken,
  })

  try {
    const { error: sendErr } = await resend.emails.send({
      from: `PAP Diagnóstico <resultados@${process.env.RESEND_DOMAIN || 'resultados.papdiagnostico.com'}>`,
      to: recipient_email,
      subject: `Resultado de PAP disponible — ${patient.full_name}`,
      html,
    })

    if (sendErr) {
      return NextResponse.json({ error: sendErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
