import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function getLabEmail(supabase: Awaited<ReturnType<typeof createClient>>, tenantId: string): Promise<string | null> {
  const { data } = await supabase
    .schema('_public')
    .from('tenants')
    .select('email')
    .eq('id', tenantId)
    .single()
  return data?.email || null
}

async function getPatientEmail(supabase: Awaited<ReturnType<typeof createClient>>, patientId: string): Promise<string | null> {
  const { data } = await supabase
    .from('patient')
    .select('email')
    .eq('id', patientId)
    .single()
  return data?.email || null
}

export async function GET() {
  const supabase = await createClient()
  const results: Record<string, unknown> = {}

  // 1. Auto-archivar órdenes completadas/enviadas con más de 1 año
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data: archived, error: archErr } = await supabase
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
    .select('*, order:order_id!inner(id, status, patient_id, tenant_id)')
    .or(`next_send_at.lte.now(),and(mode.eq.immediate,last_sent_at.is.null)`)
    .eq('order.status', 'completed')

  let sent = 0
  let failed = 0

  if (pending) {
    for (const s of pending) {
      const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

      // Intentar enviar al lab primero, luego al paciente
      const labEmail = await getLabEmail(supabase, s.order.tenant_id)
      const patientEmail = await getPatientEmail(supabase, s.order.patient_id)

      const recipients = [labEmail, patientEmail].filter(Boolean) as string[]

      if (recipients.length === 0) {
        // Sin emails configurados, igual marcamos como enviado
        await supabase
          .from('send_schedule')
          .update({ last_sent_at: new Date().toISOString(), next_send_at: null })
          .eq('id', s.id)
        sent++
        continue
      }

      try {
        const sendRes = await fetch(`${origin}/api/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: s.order_id, recipient_email: recipients[0] }),
        })

        if (sendRes.ok) {
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
      } catch {
        failed++
      }
    }
  }

  results.sent = sent
  results.failed = failed
  results.total_pending = pending?.length || 0

  return NextResponse.json(results)
}
