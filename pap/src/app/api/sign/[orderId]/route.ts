import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { renderResultEmail } from '@/lib/email-template'
import { sendEmail } from '@/lib/send-email'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  // 1. Firmar el diagnóstico
  const hash = `sha256-${Buffer.from(orderId + user.id).toString('base64').slice(0, 16)}`

  const { error: signErr } = await supabase
    .from('diagnosis')
    .update({
      is_signed: true,
      signed_at: new Date().toISOString(),
      digital_signature: hash,
    })
    .eq('order_id', orderId)

  if (signErr) return NextResponse.json({ error: signErr.message }, { status: 500 })

  // 2. Obtener datos para el envío
  const [orderRes, diagnosisRes, scheduleRes] = await Promise.all([
    supabase.from('order').select('*, patient:patient_id(*)').eq('id', orderId).single(),
    supabase.from('diagnosis').select('*').eq('order_id', orderId).single(),
    supabase.from('send_schedule').select('mode').eq('order_id', orderId).maybeSingle(),
  ])

  const orderData = orderRes.data
  const diagnosisData = diagnosisRes.data
  const schedule = scheduleRes.data

  // 3. Enviar email solo si el modo es inmediato
  const shouldSend = schedule?.mode === 'immediate'
  let sendResult: { ok: boolean; error?: string } = { ok: true }

  if (shouldSend) {
    const { data: lab } = await supabase
      .schema('_public')
      .from('tenants')
      .select('name, email')
      .eq('id', orderData?.tenant_id)
      .single()
    const labName = (lab?.name as string) || 'Laboratorio'
    const labEmail = (lab as { email?: string } | undefined)?.email

    // Enviar al email del laboratorio donde se generó el diagnóstico
    const patientEmail = (orderData?.patient as { email?: string } | undefined)?.email
    const recipient = labEmail || patientEmail

    if (recipient) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const accessToken = (orderData?.pdf_token as string) || orderId
      const portalUrl = `${baseUrl}/portal/paciente`
      const labPortalUrl = labEmail ? `${baseUrl}/portal/lab` : undefined

      const html = renderResultEmail({
        labName,
        patientName: ((orderData?.patient as { full_name?: string } | undefined)?.full_name) || 'Paciente',
        patientDni: ((orderData?.patient as { dni?: string } | undefined)?.dni) || '',
        diagnosisDate: diagnosisData?.signed_at
          ? new Date(diagnosisData.signed_at).toLocaleDateString('es-AR')
          : new Date().toLocaleDateString('es-AR'),
        generalCategory: diagnosisData?.general_category || '—',
        portalUrl,
        accessToken,
        labPortalUrl,
      })

      sendResult = await sendEmail(supabase, {
        to: recipient,
        subject: `Resultado de PAP disponible — ${((orderData?.patient as { full_name?: string } | undefined)?.full_name) || 'Paciente'}`,
        html,
      })
    } else {
      sendResult = { ok: false, error: 'Sin email de destino: el laboratorio no tiene email configurado ni el paciente tiene email cargado' }
    }
  }

  // 4. Actualizar estado según envío
  if (shouldSend && sendResult.ok) {
    await supabase.from('order').update({ status: 'delivered' }).eq('id', orderId)
  } else {
    await supabase.from('order').update({ status: 'completed' }).eq('id', orderId)
  }

  return NextResponse.json({
    success: true,
    signature: hash,
    status: shouldSend && sendResult.ok ? 'delivered' : 'completed',
    sent: shouldSend && sendResult.ok,
    sendError: sendResult.error || null,
  })
}
