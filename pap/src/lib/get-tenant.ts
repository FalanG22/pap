import { createClient } from './supabase-server'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getUserTenant(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  const { data: internalUser } = await supabase
    .schema('_public')
    .from('users')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()

  if (!internalUser) return null

  const { data: tu } = await supabase
    .schema('_public')
    .from('tenant_users')
    .select('tenant_id, role')
    .eq('user_id', internalUser.id)
    .limit(1)
    .maybeSingle()

  return tu ? { tenant_id: tu.tenant_id, role: tu.role, internal_user_id: internalUser.id } : null
}

export type TenantContext = Awaited<ReturnType<typeof getUserTenant>>
