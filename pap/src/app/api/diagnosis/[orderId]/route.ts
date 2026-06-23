import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { data: order, error: orderError } = await supabase
    .from('order')
    .select('*, patient:patient_id(*)')
    .eq('id', orderId)
    .single()

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

  const { data: diagnosis } = await supabase
    .from('diagnosis')
    .select('*')
    .eq('order_id', orderId)
    .single()

  const { data: history } = await supabase
    .from('diagnosis')
    .select('*, order!inner(patient_id)')
    .eq('order.patient_id', order.patient_id)
    .eq('is_signed', true)
    .order('signed_at', { ascending: false })
    .limit(3)
    .neq('order_id', orderId)

  return NextResponse.json({ order, diagnosis, history })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const body = await request.json()

  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No tenant' }, { status: 403 })

  const { data: order } = await supabase
    .from('order')
    .select('tenant_id')
    .eq('id', orderId)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('diagnosis')
    .upsert({
      order_id: orderId,
      specialist_id: tenant.internal_user_id,
      ...body,
      tenant_id: order.tenant_id,
    }, { onConflict: 'order_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
