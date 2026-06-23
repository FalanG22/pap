import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'

export async function GET(request: Request) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenant_id')

  let targetTenantId = tenant.tenant_id
  if (tenant.role === 'super_admin' && tenantId) {
    targetTenantId = tenantId
  }

  const { data } = await supabase
    .schema('_public')
    .from('tenant_afip_config')
    .select('*')
    .eq('tenant_id', targetTenantId)
    .maybeSingle()

  return NextResponse.json(data || null)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })
  if (tenant.role !== 'super_admin' && tenant.role !== 'lab_admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json()
  const targetTenantId = (tenant.role === 'super_admin' && body.tenant_id)
    ? body.tenant_id
    : tenant.tenant_id

  if (tenant.role !== 'super_admin' && targetTenantId !== tenant.tenant_id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const allowed: Record<string, unknown> = {}
  if (body.cuit !== undefined) allowed.cuit = body.cuit
  if (body.environment !== undefined) allowed.environment = body.environment
  if (body.punto_venta !== undefined) allowed.punto_venta = body.punto_venta
  if (body.certificate_crt !== undefined) allowed.certificate_crt = body.certificate_crt
  if (body.certificate_key !== undefined) allowed.certificate_key = body.certificate_key
  if (body.certificate_key_pass !== undefined) allowed.certificate_key_pass = body.certificate_key_pass
  if (body.is_active !== undefined) allowed.is_active = body.is_active

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .schema('_public')
    .from('tenant_afip_config')
    .select('id')
    .eq('tenant_id', targetTenantId)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .schema('_public')
      .from('tenant_afip_config')
      .update(allowed)
      .eq('tenant_id', targetTenantId)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .schema('_public')
    .from('tenant_afip_config')
    .insert({ tenant_id: targetTenantId, ...allowed })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
