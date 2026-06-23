import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'

export async function GET() {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { data, error } = await supabase
    .schema('_public')
    .from('tenants')
    .select('config')
    .eq('id', tenant.tenant_id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((data as unknown as { config: Record<string, unknown> })?.config || {})
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const body = await request.json()
  const { signature_url, stamp_url, show_signature, show_stamp, stamp_size, custom_sample_quality_options } = body

  // Obtener config actual
  const { data: current } = await supabase
    .schema('_public')
    .from('tenants')
    .select('config')
    .eq('id', tenant.tenant_id)
    .single()

  const config = (current as unknown as { config: Record<string, unknown> })?.config || {}

  if (signature_url !== undefined) config.signature_url = signature_url
  if (stamp_url !== undefined) config.stamp_url = stamp_url
  if (show_signature !== undefined) config.show_signature = show_signature
  if (show_stamp !== undefined) config.show_stamp = show_stamp
  if (stamp_size !== undefined) config.stamp_size = stamp_size
  if (custom_sample_quality_options !== undefined) config.custom_sample_quality_options = custom_sample_quality_options

  const { error } = await supabase
    .schema('_public')
    .from('tenants')
    .update({ config })
    .eq('id', tenant.tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
