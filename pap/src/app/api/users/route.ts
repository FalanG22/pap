import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

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

function generatePassword(length = 10): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const all = upper + lower + digits
  let pw = ''
  pw += upper[Math.floor(Math.random() * upper.length)]
  pw += lower[Math.floor(Math.random() * lower.length)]
  pw += digits[Math.floor(Math.random() * digits.length)]
  for (let i = 3; i < length; i++) {
    pw += all[Math.floor(Math.random() * all.length)]
  }
  return pw.split('').sort(() => Math.random() - 0.5).join('')
}

export async function GET() {
  const supabase = await createClient()
  const sa = await getSuperAdmin(supabase)
  if (!sa) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { data: users } = await supabase
    .schema('_public')
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: links } = await supabase
    .schema('_public')
    .from('tenant_users')
    .select('*, tenant:tenant_id(name)')

  const result = (users || []).map(u => ({
    ...u,
    tenants: (links || []).filter(l => l.user_id === u.id).map(l => ({
      id: l.id,
      tenant_id: l.tenant_id,
      tenant_name: (l.tenant as unknown as { name: string })?.name || '—',
      role: l.role,
    })),
  }))

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const sa = await getSuperAdmin(supabase)
  if (!sa) return NextResponse.json({ error: 'Solo super_admin' }, { status: 403 })

  const body = await request.json()
  const { email, full_name, tenant_id, role } = body

  if (!email || !full_name || !tenant_id || !role) {
    return NextResponse.json({ error: 'email, full_name, tenant_id y role son requeridos' }, { status: 400 })
  }

  if (!['super_admin', 'lab_admin', 'viewer'].includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .schema('_public')
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  let userId: string
  if (existing) {
    userId = existing.id
  } else {
    const { data: newUser, error: createErr } = await supabase
      .schema('_public')
      .from('users')
      .insert({ email, full_name })
      .select()
      .single()

    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 })
    userId = newUser.id
  }

  const { data: existingLink } = await supabase
    .schema('_public')
    .from('tenant_users')
    .select('id')
    .eq('user_id', userId)
    .eq('tenant_id', tenant_id)
    .maybeSingle()

  if (!existingLink) {
    const { error: linkErr } = await supabase
      .schema('_public')
      .from('tenant_users')
      .insert({ tenant_id, user_id: userId, role })

    if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 })
  } else {
    await supabase
      .schema('_public')
      .from('tenant_users')
      .update({ role })
      .eq('id', existingLink.id)
  }

  // Siempre generar contraseña y crear auth user
  const password = generatePassword()

  const adminSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: adminErr } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  const response: Record<string, unknown> = {
    id: userId,
    email,
    full_name,
    tenant_id,
    role,
    generated_password: password,
  }

  if (adminErr) {
    if (adminErr.message?.includes('already exists') || adminErr.message?.includes('already registered')) {
      // Buscar el auth user por email para actualizar la contraseña con el ID correcto
      const { data: authUsers } = await adminSupabase.auth.admin.listUsers()
      const authUser = authUsers?.users?.find(u => u.email === email)
      if (authUser) {
        const { error: updateErr } = await adminSupabase.auth.admin.updateUserById(authUser.id, { password })
        if (updateErr) response.auth_error = updateErr.message
      } else {
        response.auth_error = 'Usuario de auth no encontrado'
      }
    } else {
      response.auth_error = adminErr.message
    }
  }

  return NextResponse.json(response)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const sa = await getSuperAdmin(supabase)
  if (!sa) return NextResponse.json({ error: 'Solo super_admin' }, { status: 403 })

  const body = await request.json()
  const { id, email, full_name, is_active } = body
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (email !== undefined) updates.email = email
  if (full_name !== undefined) updates.full_name = full_name
  if (is_active !== undefined) updates.is_active = is_active

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 })
  }

  const { error } = await supabase
    .schema('_public')
    .from('users')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const sa = await getSuperAdmin(supabase)
  if (!sa) return NextResponse.json({ error: 'Solo super_admin' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  await supabase.schema('_public').from('tenant_users').delete().eq('user_id', id)
  const { error } = await supabase.schema('_public').from('users').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
