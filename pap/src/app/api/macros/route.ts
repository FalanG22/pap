import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'

async function isSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false
  const { data: internalUser } = await supabase
    .schema('_public').from('users').select('id').eq('email', user.email).maybeSingle()
  if (!internalUser) return false
  const { data: roles } = await supabase
    .schema('_public').from('tenant_users').select('role').eq('user_id', internalUser.id)
  return roles?.some(r => r.role === 'super_admin') ?? false
}

export async function GET(request: Request) {
  const supabase = await createClient()
  if (!await isSuperAdmin(supabase)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenant_id') || tenant.tenant_id

  const { data, error } = await supabase
    .from('macros_template')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('category', { ascending: true })
    .order('shortcode', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  if (!await isSuperAdmin(supabase)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const body = await request.json()
  const { shortcode, full_text, category } = body
  if (!shortcode || !full_text) {
    return NextResponse.json({ error: 'shortcode y full_text son requeridos' }, { status: 400 })
  }

  const code = shortcode.startsWith('.') ? shortcode : `.${shortcode}`

  const { data, error } = await supabase
    .from('macros_template')
    .insert({ tenant_id: tenant.tenant_id, shortcode: code, full_text, category })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe una macro con ese shortcode' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  if (!await isSuperAdmin(supabase)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const body = await request.json()
  const { id, shortcode, full_text, category } = body
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (shortcode !== undefined) {
    updates.shortcode = shortcode.startsWith('.') ? shortcode : `.${shortcode}`
  }
  if (full_text !== undefined) updates.full_text = full_text
  if (category !== undefined) updates.category = category

  const { data, error } = await supabase
    .from('macros_template')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenant.tenant_id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe una macro con ese shortcode' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  if (!await isSuperAdmin(supabase)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { error } = await supabase
    .from('macros_template')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenant.tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
