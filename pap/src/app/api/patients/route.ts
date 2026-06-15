import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'

export async function GET() {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { data: patients, error } = await supabase
    .from('patient')
    .select('*')
    .eq('tenant_id', tenant.tenant_id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(patients)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const body = await request.json()
  const dni = body.dni?.replace(/\./g, '') || body.dni

  // Si el paciente ya existe para este tenant, devolverlo (y actualizar datos si cambiaron)
  const { data: existing } = await supabase
    .from('patient')
    .select('*')
    .eq('tenant_id', tenant.tenant_id)
    .eq('dni', dni)
    .maybeSingle()

  if (existing) {
    const { data: updated, error: updErr } = await supabase
      .from('patient')
      .update({ ...body, dni, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
    return NextResponse.json(updated)
  }

  const { data, error } = await supabase
    .from('patient')
    .insert({ ...body, dni, tenant_id: tenant.tenant_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
