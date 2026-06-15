import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No tenant' }, { status: 403 })

  const { error } = await supabase
    .from('order')
    .update({
      downloaded_at: new Date().toISOString(),
      downloaded_by: tenant.internal_user_id,
    })
    .eq('id', orderId)
    .eq('tenant_id', tenant.tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, downloaded_at: new Date().toISOString() })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { data: order, error } = await supabase
    .from('order')
    .select('downloaded_at, downloaded_by')
    .eq('id', orderId)
    .eq('tenant_id', tenant.tenant_id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    downloaded: !!order?.downloaded_at,
    downloaded_at: order?.downloaded_at || null,
    downloaded_by: order?.downloaded_by || null,
  })
}
