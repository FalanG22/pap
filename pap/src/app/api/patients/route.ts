import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'

export async function GET(request: Request) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const dni = searchParams.get('dni')

  if (dni) {
    // Lookup by DNI (used for form autofill)
    const { data } = await supabase
      .from('patient')
      .select('*')
      .eq('tenant_id', tenant.tenant_id)
      .eq('dni', dni.replace(/\./g, ''))
      .maybeSingle()
    return NextResponse.json(data || null)
  }

  const procedencias = searchParams.get('procedencias')
  if (procedencias === 'true') {
    const { data } = await supabase
      .from('patient')
      .select('procedencia')
      .eq('tenant_id', tenant.tenant_id)
      .not('procedencia', 'is', null)
      .order('procedencia')
    const unique = [...new Set((data || []).map(r => (r as { procedencia: string }).procedencia).filter(Boolean))]
    return NextResponse.json(unique)
  }

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

  const { data: existing } = await supabase
    .from('patient')
    .select('*')
    .eq('tenant_id', tenant.tenant_id)
    .eq('dni', dni)
    .maybeSingle()

  if (existing) {
    // Solo actualizar campos que vienen definidos (no null/empty)
    const updFields: Record<string, unknown> = { dni, updated_at: new Date().toISOString() }
    for (const key of ['full_name', 'birth_date', 'sex', 'email', 'phone', 'procedencia']) {
      if (body[key] !== undefined && body[key] !== null && body[key] !== '') {
        updFields[key] = body[key]
      }
    }
    const { data: updated, error: updErr } = await supabase
      .from('patient')
      .update(updFields)
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
