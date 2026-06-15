import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'

export async function POST(request: Request) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const body = await request.json()
  const { order_id, mode, custom_dates } = body

  if (!order_id || !mode) {
    return NextResponse.json({ error: 'order_id y mode son requeridos' }, { status: 400 })
  }

  const payload: Record<string, unknown> = {
    order_id,
    tenant_id: tenant.tenant_id,
    mode,
    custom_dates: custom_dates || [],
  }

  const { data, error } = await supabase
    .from('send_schedule')
    .upsert(payload, { onConflict: 'order_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('order_id')

  if (!orderId) {
    const { data, error } = await supabase
      .from('send_schedule')
      .select('*, order:order_id(id, status, patient:patient_id(full_name, email))')
      .eq('tenant_id', tenant.tenant_id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('send_schedule')
    .select('*')
    .eq('order_id', orderId)
    .eq('tenant_id', tenant.tenant_id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
