import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const tenantIdParam = searchParams.get('tenant_id')

  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  let query = supabase
    .from('order')
    .select('*, patient:patient_id(*), diagnosis(*)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (tenantIdParam) {
    // Si se pasa tenant_id específico, filtrar por ese
    query = query.eq('tenant_id', tenantIdParam)
  } else {
    // Sino, usar el tenant por defecto del usuario
    query = query.eq('tenant_id', tenant.tenant_id)
  }

  const { data: orders, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(orders)
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
