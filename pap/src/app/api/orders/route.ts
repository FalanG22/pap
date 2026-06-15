import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUserTenant } from '@/lib/get-tenant'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const tenantIdParam = searchParams.get('tenant_id')

  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  let query = supabase
    .from('order')
    .select('*, diagnosis(*), downloaded_at, downloaded_by')
    .order('created_at', { ascending: false })
    .limit(50)

  if (tenantIdParam) {
    query = query.eq('tenant_id', tenantIdParam)
  } else {
    query = query.eq('tenant_id', tenant.tenant_id)
  }

  const { data: orders, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!orders || orders.length === 0) return NextResponse.json([])

  const patientIds = orders.map(o => o.patient_id).filter(Boolean)
  let patientMap: Record<string, unknown> = {}

  if (patientIds.length > 0) {
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: patients } = await serviceSupabase
      .from('patient')
      .select('*')
      .in('id', patientIds)

    if (patients) {
      for (const p of patients) {
        patientMap[p.id] = p
      }
    }
  }

  const result = orders.map(o => ({
    ...o,
    patient: patientMap[o.patient_id] || null,
  }))

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const body = await request.json()
  const tenantId = body.tenant_id || tenant.tenant_id

  const { data, error } = await supabase
    .from('order')
    .insert({ patient_id: body.patient_id, tenant_id: tenantId })
    .select('*, patient:patient_id(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
