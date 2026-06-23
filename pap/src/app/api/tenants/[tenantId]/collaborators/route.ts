import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

async function getCurrentUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  const { data: internalUser } = await supabase
    .schema('_public')
    .from('users')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()

  return internalUser || null
}

async function canManageTenant(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, tenantId: string) {
  const { data: roles } = await supabase
    .schema('_public')
    .from('tenant_users')
    .select('role')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)

  return roles?.some(r => r.role === 'lab_admin') ||
    roles?.some(r => r.role === 'super_admin')
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const supabase = await createClient()
  const currentUser = await getCurrentUser(supabase)
  if (!currentUser) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { tenantId } = await params

  const canManage = await canManageTenant(supabase, currentUser.id, tenantId)
  if (!canManage) return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })

  const [usersResult, linksResult] = await Promise.all([
    supabase.schema('_public').from('users').select('id, email, full_name, is_active').order('full_name'),
    supabase.schema('_public').from('tenant_users').select('user_id, role').eq('tenant_id', tenantId),
  ])

  if (usersResult.error) return NextResponse.json({ error: usersResult.error.message }, { status: 500 })
  if (linksResult.error) return NextResponse.json({ error: linksResult.error.message }, { status: 500 })

  const linkMap = new Map((linksResult.data || []).map(l => [l.user_id, l.role]))

  const result = (usersResult.data || []).map(u => ({
    user_id: u.id,
    email: u.email,
    full_name: u.full_name,
    is_active: u.is_active,
    permission: linkMap.get(u.id) || 'not_shared',
  }))

  return NextResponse.json(result)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const supabase = await createClient()
  const currentUser = await getCurrentUser(supabase)
  if (!currentUser) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { tenantId } = await params

  const canManage = await canManageTenant(supabase, currentUser.id, tenantId)
  if (!canManage) return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })

  const body = await request.json()
  const { user_id, permission } = body

  if (!user_id || !permission) {
    return NextResponse.json({ error: 'user_id y permission son requeridos' }, { status: 400 })
  }

  if (!['not_shared', 'lab_admin', 'viewer'].includes(permission)) {
    return NextResponse.json({ error: 'Permiso inválido' }, { status: 400 })
  }

  if (user_id === currentUser.id) {
    return NextResponse.json({ error: 'No puedes cambiar tus propios permisos' }, { status: 400 })
  }

  if (permission === 'not_shared') {
    await supabase
      .schema('_public')
      .from('tenant_users')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', user_id)
  } else {
    const { data: existing } = await supabase
      .schema('_public')
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', user_id)
      .maybeSingle()

    if (existing) {
      await supabase
        .schema('_public')
        .from('tenant_users')
        .update({ role: permission })
        .eq('id', existing.id)
    } else {
      await supabase
        .schema('_public')
        .from('tenant_users')
        .insert({ tenant_id: tenantId, user_id, role: permission })
    }
  }

  return NextResponse.json({ success: true, user_id, permission })
}
