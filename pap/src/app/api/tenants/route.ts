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
  const { name, slug, full_name } = body
  let { email } = body
  if (!name || !slug) {
    return NextResponse.json({ error: 'name y slug son requeridos' }, { status: 400 })
  }
  if (!email) {
    email = `${slug.replace(/-/g, '.')}@syspap.com`
  }

  const { data: tenantId, error: rpcErr } = await supabase
    .rpc('create_tenant', { p_name: name, p_slug: slug, p_email: email })

  if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 })

  const password = generatePassword()

  const { data: newUser, error: createUserErr } = await supabase
    .schema('_public')
    .from('users')
    .insert({ email, full_name: full_name || name })
    .select()
    .single()

  if (createUserErr) return NextResponse.json({ error: createUserErr.message }, { status: 500 })

  const { error: linkErr } = await supabase
    .schema('_public')
    .from('tenant_users')
    .insert({ tenant_id: tenantId, user_id: newUser.id, role: 'lab_admin' })

  if (linkErr) console.error('Error vinculando usuario al tenant:', linkErr)

  const adminSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: adminErr } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name || name },
  })

  const response: Record<string, unknown> = {
    id: tenantId, name, slug, email,
    user_id: newUser.id,
    generated_password: password,
  }

  if (adminErr) {
    if (adminErr.message?.includes('already exists')) {
      await adminSupabase.auth.admin.updateUserById(newUser.id, { password })
    } else {
      response.auth_error = adminErr.message
    }
  }

  return NextResponse.json(response)
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

  const { error } = await supabase.rpc('delete_tenant', { p_tenant_id: id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
