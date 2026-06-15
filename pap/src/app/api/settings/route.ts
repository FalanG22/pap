import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const ADMIN_KEYS = ['app_domain', 'from_email', 'from_name', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure', 'cloudflare_worker_url']

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { data: settings, error } = await supabase
    .schema('_public')
    .from('settings')
    .select('*')
    .order('key')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(settings || [])
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const body = await request.json()
  const updates: { key: string; value: string }[] = body.updates
  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: 'updates debe ser un array' }, { status: 400 })
  }

  const invalid = updates.find(u => !ADMIN_KEYS.includes(u.key))
  if (invalid) {
    return NextResponse.json({ error: `Clave inválida: ${invalid.key}` }, { status: 400 })
  }

  for (const { key, value } of updates) {
    await supabase
      .schema('_public')
      .from('settings')
      .upsert({ key, value }, { onConflict: 'key' })
  }

  return NextResponse.json({ success: true })
}
