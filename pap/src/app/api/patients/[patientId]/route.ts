import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUserTenant } from '@/lib/get-tenant'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { data: patient, error: patientErr } = await supabase
    .from('patient')
    .select('*')
    .eq('id', patientId)
    .single()

  if (patientErr || !patient) {
    return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
  }

  const { data: orders, error: ordersErr } = await supabase
    .from('order')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (ordersErr) {
    return NextResponse.json({ error: ordersErr.message }, { status: 500 })
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const ordersWithDx = await Promise.all((orders || []).map(async (o) => {
    const { data: dx } = await serviceSupabase
      .from('diagnosis')
      .select('*')
      .eq('order_id', o.id)
      .maybeSingle()

    return { ...o, diagnosis: dx || null }
  }))

  return NextResponse.json({ patient, orders: ordersWithDx })
}
