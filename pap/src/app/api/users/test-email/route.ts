import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import nodemailer from 'nodemailer'

async function getAdminEmail(supabase: Awaited<ReturnType<typeof createClient>>) {
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

  return roles?.some(r => r.role === 'super_admin') ? user.email : null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const adminEmail = await getAdminEmail(supabase)
  if (!adminEmail) return NextResponse.json({ error: 'Solo super_admin' }, { status: 403 })

  const body = await request.json()
  const { method } = body

  const { data: settings } = await supabase
    .schema('_public')
    .from('settings')
    .select('key, value')

  const s: Record<string, string> = {}
  for (const x of settings || []) s[x.key] = x.value

  const fromEmail = s.from_email || 'resultados@papdiagnostico.com'
  const fromName = s.from_name || 'PAP Diagnóstico'
  const subject = 'PAP Diagnóstico — Prueba de configuración de email'
  const html = `
    <!DOCTYPE html>
    <html><body style="font-family:sans-serif;padding:32px">
      <h1 style="font-size:18px;color:#1e1e2e">Prueba de email</h1>
      <p style="color:#6b7280">Si estás viendo este mensaje, la configuración de email funciona correctamente.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="font-size:12px;color:#9ca3af">PAP Diagnóstico — Envío de credenciales</p>
    </body></html>
  `

  if (method === 'cloudflare' || (!method && s.cloudflare_worker_url)) {
    if (!s.cloudflare_worker_url) {
      return NextResponse.json({ error: 'Cloudflare Worker no configurado' }, { status: 400 })
    }
    try {
      const cfRes = await fetch(s.cloudflare_worker_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: adminEmail,
          from: fromEmail,
          from_name: fromName,
          subject,
          html,
        }),
      })
      if (!cfRes.ok) {
        const err = await cfRes.text()
        return NextResponse.json({ error: `Cloudflare Worker: ${err}` }, { status: 500 })
      }
      return NextResponse.json({ success: true, method: 'cloudflare', to: adminEmail })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      return NextResponse.json({ error: `Cloudflare Worker: ${msg}` }, { status: 500 })
    }
  }

  if (!s.smtp_host || !s.smtp_port || !s.smtp_user || !s.smtp_pass) {
    return NextResponse.json({ error: 'SMTP no configurado' }, { status: 400 })
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
      to: adminEmail,
      subject,
      html,
    })
    return NextResponse.json({ success: true, method: 'smtp', to: adminEmail })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: `Error SMTP: ${msg}` }, { status: 500 })
  }
}
