import nodemailer from 'nodemailer'
import type { SupabaseClient } from '@supabase/supabase-js'

async function getSmtpConfig(supabase: SupabaseClient) {
  const { data: settings } = await supabase
    .schema('_public')
    .from('settings')
    .select('key, value')

  const s: Record<string, string> = {}
  for (const x of settings || []) s[x.key] = x.value

  return {
    host: s.smtp_host || process.env.SMTP_HOST,
    port: parseInt(s.smtp_port || process.env.SMTP_PORT || '587', 10),
    user: s.smtp_user || process.env.SMTP_USER,
    pass: s.smtp_pass || process.env.SMTP_PASS,
    secure: s.smtp_secure === 'true',
    fromEmail: s.from_email || process.env.SMTP_FROM_EMAIL || s.smtp_user || process.env.SMTP_USER || 'noreply@papdiagnostico.com',
    fromName: s.from_name || process.env.SMTP_FROM_NAME || 'PAP Diagnóstico',
  }
}

export async function sendEmail(
  supabase: SupabaseClient,
  { to, subject, html, attachments }: { to: string; subject: string; html: string; attachments?: { filename: string; content: Buffer }[] }
): Promise<{ ok: boolean; error?: string }> {
  const cfg = await getSmtpConfig(supabase)

  if (!cfg.host || !cfg.user || !cfg.pass) {
    return { ok: false, error: 'SMTP no configurado. Configurá SMTP en Ajustes > SMTP.' }
  }

  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  })

  try {
    const mailOptions: Record<string, unknown> = {
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to,
      subject,
      html,
    }
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(a => ({
        filename: a.filename,
        content: a.content,
      }))
    }
    await transport.sendMail(mailOptions)
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: msg }
  }
}
