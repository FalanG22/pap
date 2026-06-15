import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

async function getSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  const { data: internalUser } = await supabase
    .schema('_public')
    .from('users')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()
  if (!internalUser) return null

  const { data: roles } = await supabase
    .schema('_public')
    .from('tenant_users')
    .select('role')
    .eq('user_id', internalUser.id)

  return roles?.some(r => r.role === 'super_admin') ? internalUser : null
}

export async function GET() {
  const supabase = await createClient()
  const user = await getSuperAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { data: tenants, error } = await supabase
    .schema('_public')
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(tenants)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const internalUser = await getSuperAdmin(supabase)
  if (!internalUser) return NextResponse.json({ error: 'Solo super_admin' }, { status: 403 })

  const body = await request.json()
  const { name, slug } = body
  if (!name || !slug) {
    return NextResponse.json({ error: 'name y slug son requeridos' }, { status: 400 })
  }

  const { data: tenantId, error: rpcErr } = await supabase
    .rpc('create_tenant', { p_name: name, p_slug: slug })

  if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 })

  const { error: linkErr } = await supabase
    .schema('_public')
    .from('tenant_users')
    .insert({ tenant_id: tenantId, user_id: internalUser.id, role: 'super_admin' })

  if (linkErr) console.error('Error vinculando creador al tenant:', linkErr)

  return NextResponse.json({ id: tenantId, name, slug })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const internalUser = await getSuperAdmin(supabase)
  if (!internalUser) return NextResponse.json({ error: 'Solo super_admin' }, { status: 403 })

  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const allowedFields: Record<string, unknown> = {}
  if (updates.name !== undefined) allowedFields.name = updates.name
  if (updates.slug !== undefined) allowedFields.slug = updates.slug
  if (updates.is_active !== undefined) allowedFields.is_active = updates.is_active
  if (updates.email !== undefined) allowedFields.email = updates.email

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 })
  }

  const { data, error } = await supabase
    .schema('_public')
    .from('tenants')
    .update(allowedFields)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const internalUser = await getSuperAdmin(supabase)
  if (!internalUser) return NextResponse.json({ error: 'Solo super_admin' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  // Eliminar datos del tenant (órdenes, pacientes, etc. se borran en cascada)
  await supabase.schema('_public').from('tenant_users').delete().eq('tenant_id', id)
  await supabase.from('send_schedule').delete().eq('tenant_id', id)
  await supabase.from('notification').delete().eq('tenant_id', id)
  await supabase.from('audit_log').delete().eq('tenant_id', id)
  await supabase.from('diagnosis').delete().eq('tenant_id', id)
  await supabase.from('order').delete().eq('tenant_id', id)
  await supabase.from('patient').delete().eq('tenant_id', id)
  await supabase.from('macros_template').delete().eq('tenant_id', id)

  const { error } = await supabase.schema('_public').from('tenants').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
