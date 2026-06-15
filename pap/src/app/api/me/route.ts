import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { data: internalUser } = await supabase
    .schema('_public')
    .from('users')
    .select('id, full_name')
    .eq('email', user.email)
    .maybeSingle()

  if (!internalUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 403 })

  const { data: myTenants } = await supabase
    .schema('_public')
    .from('tenant_users')
    .select('role, tenant:tenant_id(id, name, slug)')
    .eq('user_id', internalUser.id)

  if (!myTenants || myTenants.length === 0) {
    return NextResponse.json({ user: internalUser, tenants: [] })
  }

  const tenants = myTenants.map(t => ({
    id: (t.tenant as unknown as { id: string }).id,
    name: (t.tenant as unknown as { name: string }).name,
    slug: (t.tenant as unknown as { slug: string }).slug,
    role: t.role,
  }))

  return NextResponse.json({
    user: internalUser,
    tenants,
    isSuperAdmin: tenants.some(t => t.role === 'super_admin'),
    currentTenant: tenants[0] || null,
  })
}
