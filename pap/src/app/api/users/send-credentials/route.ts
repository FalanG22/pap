import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { renderCredentialsEmail } from '@/lib/email-credentials'
import nodemailer from 'nodemailer'

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
    .select('name')
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
  const fromEmail = s.from_email || 'resultados@papdiagnostico.com'
  const fromName = s.from_name || 'PAP Diagnóstico'

  const html = renderCredentialsEmail({
    fullName: user.full_name,
    email: user.email,
    password,
    loginUrl,
    labName,
  })

  // Cloudflare Worker como método preferido
  if (s.cloudflare_worker_url) {
    try {
      const cfRes = await fetch(s.cloudflare_worker_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          from: fromEmail,
          from_name: fromName,
          subject: `Acceso a PAP Diagnóstico — ${labName}`,
          html,
        }),
      })
      if (!cfRes.ok) {
        const err = await cfRes.text()
        return NextResponse.json({ error: `Cloudflare Worker: ${err}` }, { status: 500 })
      }
      return NextResponse.json({ success: true, email: user.email })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      return NextResponse.json({ error: `Cloudflare Worker: ${msg}` }, { status: 500 })
    }
  }

  // Fallback a SMTP
  if (!s.smtp_host || !s.smtp_port || !s.smtp_user || !s.smtp_pass) {
    return NextResponse.json({ error: 'No hay método de envío configurado. Configurá SMTP o un Cloudflare Worker en Configuración.' }, { status: 500 })
  }

  const transporter = nodemailer.createTransport({
    host: s.smtp_host,
    port: parseInt(s.smtp_port, 10) || 587,
    secure: s.smtp_secure === 'true',
    auth: { user: s.smtp_user, pass: s.smtp_pass },
  })

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: user.email,
      subject: `Acceso a PAP Diagnóstico — ${labName}`,
      html,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error SMTP: ${msg}` }, { status: 500 })
  }

  return NextResponse.json({ success: true, email: user.email })
}
