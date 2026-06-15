import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { renderCredentialsEmail } from '@/lib/email-credentials'
import { sendEmail } from '@/lib/send-email'

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

export async function POST(request: Request) {
  const supabase = await createClient()
  const sa = await getSuperAdmin(supabase)
  if (!sa) return NextResponse.json({ error: 'Solo super_admin' }, { status: 403 })

  const body = await request.json()
  const { user_id, tenant_id, password } = body

  if (!user_id || !tenant_id || !password) {
    return NextResponse.json({ error: 'user_id, tenant_id y password son requeridos' }, { status: 400 })
  }

  const { data: user, error: userErr } = await supabase
    .schema('_public')
    .from('users')
    .select('email, full_name')
    .eq('id', user_id)
    .single()

  if (userErr || !user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  const { data: lab } = await supabase
    .schema('_public')
    .from('tenants')
    .select('name, domain')
    .eq('id', tenant_id)
    .single()

  const labName = (lab as unknown as { name: string })?.name || 'Laboratorio'

  const { data: settings } = await supabase
    .schema('_public')
    .from('settings')
    .select('key, value')

  const s: Record<string, string> = {}
  for (const x of settings || []) s[x.key] = x.value

  const loginUrl = `${s.app_domain || 'http://localhost:3000'}/login`

  const html = renderCredentialsEmail({
    fullName: user.full_name,
    email: user.email,
    password,
    loginUrl,
    labName,
  })

  const result = await sendEmail(supabase, {
    to: user.email,
    subject: `Acceso a PAP Diagnóstico — ${labName}`,
    html,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true, email: user.email })
}
