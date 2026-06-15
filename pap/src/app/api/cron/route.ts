import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { renderResultEmail } from '@/lib/email-template'
import { sendEmail } from '@/lib/send-email'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function getAdminEmailForTenant(supabase: Awaited<ReturnType<typeof createClient>>, tenantId: string): Promise<string | null> {
  const { data } = await supabase
    .schema('_public')
    .from('tenant_users')
    .select('user:user_id(email)')
    .eq('tenant_id', tenantId)
    .in('role', ['super_admin', 'lab_admin'])
    .limit(1)
    .maybeSingle()
  return (data?.user as { email?: string } | undefined)?.email || null
}

async function getPatientData(supabase: Awaited<ReturnType<typeof createClient>>, patientId: string) {
  const { data } = await supabase
    .from('patient')
    .select('email, full_name, dni')
    .eq('id', patientId)
    .single()
  return data
}

export async function GET() {
  const supabase = await createClient()
  const results: Record<string, unknown> = {}

  // 1. Auto-archivar órdenes > 1 año
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: archived } = await supabase
    .from('order')
    .update({ archived_at: new Date().toISOString() })
    .in('status', ['completed', 'delivered'])
    .lt('created_at', oneYearAgo.toISOString())
    .is('archived_at', null)
    .select('id')

  results.archived = archived?.length || 0

  // 2. Procesar schedules de envío
  const { data: pending } = await supabase
    .from('send_schedule')
    .select('*, order:order_id!inner(id, status, patient_id, tenant_id, pdf_token), diagnosis:order_id!inner(*)')
    .or(`next_send_at.lte.now(),and(mode.eq.immediate,last_sent_at.is.null)`)
    .eq('order.status', 'completed')

  let sent = 0
  let failed = 0

  if (pending) {
    for (const s of pending) {
      const [labName, patient] = await Promise.all([
        supabase.schema('_public').from('tenants').select('name').eq('id', s.order.tenant_id).single().then(r => (r.data?.name as string) || 'Laboratorio'),
        getPatientData(supabase, s.order.patient_id),
      ])

      const patientEmail = patient?.email || null
      const adminEmail = await getAdminEmailForTenant(supabase, s.order.tenant_id)
      const recipient = adminEmail || patientEmail

      if (!recipient) {
        await supabase
          .from('send_schedule')
          .update({ last_sent_at: new Date().toISOString(), next_send_at: null })
          .eq('id', s.id)
        sent++
        continue
      }

      const { data: diagnosis } = await supabase
        .from('diagnosis')
        .select('*')
        .eq('order_id', s.order_id)
        .single()

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const accessToken = s.order.pdf_token
      const portalUrl = `${baseUrl}/portal/paciente`
      const labPortalUrl = recipient === adminEmail ? `${baseUrl}/portal/lab` : undefined

      const html = renderResultEmail({
        labName,
        patientName: patient?.full_name || 'Paciente',
        patientDni: patient?.dni || '',
        diagnosisDate: diagnosis?.signed_at
          ? new Date(diagnosis.signed_at).toLocaleDateString('es-AR')
          : new Date().toLocaleDateString('es-AR'),
        generalCategory: diagnosis?.general_category || '—',
        portalUrl,
        accessToken,
        labPortalUrl,
      })

      const result = await sendEmail(supabase, {
        to: recipient,
        subject: `Resultado de PAP disponible — ${patient?.full_name || 'Paciente'}`,
        html,
      })

      if (result.ok) {
        await Promise.all([
          supabase
            .from('send_schedule')
            .update({ last_sent_at: new Date().toISOString(), next_send_at: null })
            .eq('id', s.id),
          supabase
            .from('order')
            .update({ status: 'delivered' })
            .eq('id', s.order_id),
        ])
        sent++
      } else {
        failed++
      }
    }
  }

  results.sent = sent
  results.failed = failed
  results.total_pending = pending?.length || 0

  return NextResponse.json(results)
}
