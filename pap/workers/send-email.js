// Cloudflare Worker — Proxy de email para PAP Diagnóstico
// 1. Creá un Worker en https://dash.cloudflare.com/workers
// 2. Pegá este código
// 3. Configurá las variables de entorno en el panel del Worker:
//    - SENDGRID_API_KEY (opcional, si no usás MailChannels)
//    - o dejalo vacío para usar la API de Cloudflare Email (requiere binding)
// 4. Desplegá el Worker
// 5. Copiá la URL del Worker (ej: https://enviar-email.tu-worker.workers.dev)
// 6. Pegala en Configuración > Cloudflare Worker en el dashboard

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('Método no permitido', { status: 405 })
    }

    let body
    try { body = await request.json() } catch {
      return new Response('JSON inválido', { status: 400 })
    }

    const { to, from, from_name, subject, html } = body
    if (!to || !from || !subject || !html) {
      return new Response('Faltan campos requeridos: to, from, subject, html', { status: 400 })
    }

    // Método 1: Cloudflare Email Binding (recomendado, requiere Workers Paid)
    if (typeof EMAIL !== 'undefined') {
      try {
        await EMAIL.send({
          to,
          from: from_name ? `"${from_name}" <${from}>` : from,
          subject,
          html,
        })
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (err) {
        return new Response(err.message, { status: 500 })
      }
    }

    // Método 2: MailChannels (gratuito, funciona en Workers gratis)
    // Requiere registros SPF/DKIM en Cloudflare DNS para el dominio remitente
    try {
      const mcRes = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from, name: from_name || '' },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      })

      if (!mcRes.ok) {
        const errText = await mcRes.text()
        return new Response(errText, { status: 500 })
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err) {
      return new Response(err.message, { status: 500 })
    }
  },
}
