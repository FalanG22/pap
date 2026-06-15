import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { renderResultEmail } from '@/lib/email-template'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

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

  // 2. Obtener orden, paciente, laboratorio y schedule en paralelo
  const [orderRes, diagnosisRes, scheduleRes] = await Promise.all([
    supabase.from('order').select('*, patient:patient_id(*)').eq('id', orderId).single(),
    supabase.from('diagnosis').select('*').eq('order_id', orderId).single(),
    supabase.from('send_schedule').select('mode').eq('order_id', orderId).maybeSingle(),
  ])

  const orderData = orderRes.data
  const diagnosisData = diagnosisRes.data
  const schedule = scheduleRes.data

  // 3. Determinar si hay que enviar (default immediate cuando se firma)
  const shouldSend = !schedule || schedule.mode === 'immediate'
  let sendResult: { ok: boolean; error?: string } = { ok: true }

  if (shouldSend) {
    // Obtener datos del laboratorio
    const { data: lab } = await supabase
      .schema('_public')
      .from('tenants')
      .select('name, email, config')
      .eq('id', orderData?.tenant_id)
      .single()

    const patient = orderData?.patient as Record<string, unknown> | undefined
    const labEmail = lab?.email as string | undefined
    const patientEmail = patient?.email as string | undefined
    const recipient = labEmail || patientEmail

    // Enviar email directamente (sin fetch a /api/send)
    if (recipient && resend) {
      try {
        const labName = (lab?.name as string) || 'Laboratorio'
        const accessToken = orderData?.pdf_token as string || orderId
        const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/portal/paciente`

        const html = renderResultEmail({
          labName,
          patientName: (patient?.full_name as string) || 'Paciente',
          patientDni: (patient?.dni as string) || '',
          diagnosisDate: diagnosisData?.signed_at
            ? new Date(diagnosisData.signed_at).toLocaleDateString('es-AR')
            : new Date().toLocaleDateString('es-AR'),
          generalCategory: diagnosisData?.general_category || '—',
          portalUrl,
          accessToken,
        })

        const { error: sendErr } = await resend.emails.send({
          from: `PAP Diagnóstico <resultados@${process.env.RESEND_DOMAIN || 'resultados.papdiagnostico.com'}>`,
          to: recipient,
          subject: `Resultado de PAP disponible — ${(patient?.full_name as string) || 'Paciente'}`,
          html,
        })

        if (sendErr) {
          sendResult = { ok: false, error: sendErr.message }
        }
      } catch (e) {
        sendResult = { ok: false, error: String(e) }
      }
    } else if (!resend) {
      sendResult = { ok: false, error: 'Resend no configurado' }
    } else {
      sendResult = { ok: false, error: 'Sin email de destino configurado' }
    }
  }

  // 4. Actualizar estado de la orden
  const newStatus: 'delivered' | 'completed' = shouldSend ? 'delivered' : 'completed'
  await supabase.from('order').update({ status: newStatus }).eq('id', orderId)

  // 5. Actualizar schedule
  if (!schedule) {
    await supabase
      .from('send_schedule')
      .upsert(
        { order_id: orderId, tenant_id: orderData?.tenant_id, mode: 'immediate', last_sent_at: new Date().toISOString() },
        { onConflict: 'order_id' }
      )
  } else if (sendResult.ok) {
    await supabase
      .from('send_schedule')
      .update({ last_sent_at: new Date().toISOString(), next_send_at: null })
      .eq('order_id', orderId)
  }

  return NextResponse.json({
    success: true,
    signature: hash,
    status: newStatus,
    sent: sendResult.ok,
    sendError: sendResult.error || null,
  })
}
