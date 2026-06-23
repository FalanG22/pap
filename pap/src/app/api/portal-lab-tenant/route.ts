import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'

export async function GET() {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { data: tenantData, error } = await supabase
    .schema('_public')
    .from('tenants')
    .select('name, slug, config, created_at')
    .eq('id', tenant.tenant_id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: userData } = await supabase
    .schema('_public')
    .from('users')
    .select('email')
    .eq('id', tenant.internal_user_id)
    .maybeSingle()

  return NextResponse.json({
    name: tenantData.name,
    slug: tenantData.slug,
    email: (userData as unknown as { email: string })?.email || null,
    config: tenantData.config || {},
    createdAt: tenantData.created_at,
  })
}
