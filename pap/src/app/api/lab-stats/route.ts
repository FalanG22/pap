import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  // Buscar usuario interno
  const { data: internalUser } = await supabase
    .schema('_public')
    .from('users')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()
  if (!internalUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 403 })

  // Obtener tenants del usuario
  const { data: myTenants } = await supabase
    .schema('_public')
    .from('tenant_users')
    .select('role, tenant:tenant_id(*)')
    .eq('user_id', internalUser.id)

  if (!myTenants || myTenants.length === 0) return NextResponse.json([])

  const result = await Promise.all(myTenants.map(async (t) => {
    const tenant = t.tenant as unknown as { id: string; name: string; slug: string; email?: string; is_active: boolean; created_at: string }

    // Obtener conteos de órdenes para este tenant
    const { data: counts } = await supabase
      .from('order')
      .select('status')
      .eq('tenant_id', tenant.id)

    const total = counts?.length || 0
    const pending = counts?.filter(o => o.status === 'pending').length || 0
    const inProgress = counts?.filter(o => o.status === 'in_progress').length || 0
    const completed = counts?.filter(o => o.status === 'completed').length || 0
    const delivered = counts?.filter(o => o.status === 'delivered').length || 0

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      email: tenant.email || null,
      is_active: tenant.is_active,
      created_at: tenant.created_at,
      role: t.role,
      stats: { total, pending, inProgress, completed, delivered },
    }
  }))

  return NextResponse.json(result)
}
