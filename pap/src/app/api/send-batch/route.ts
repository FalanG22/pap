import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'
import { sendEmail } from '@/lib/send-email'
import { generatePdfBuffer } from '@/lib/generate-pdf'

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json().catch(() => ({}))
  const targetTenantId = body.tenant_id as string | undefined

  const userTenant = await getUserTenant(supabase)

  // Si se especifica tenant_id, verificar que el usuario tenga acceso a ese tenant
  if (targetTenantId) {
    const isAllowed = userTenant?.tenant_id === targetTenantId || userTenant?.role === 'super_admin'
    if (!isAllowed) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const tenant = targetTenantId
    ? await (async () => {
        const { data: t } = await supabase.schema('_public').from('tenants').select('id, name, email').eq('id', targetTenantId).single()
        return t ? { tenant_id: (t as unknown as { id: string }).id, name: (t as { name: string }).name, email: (t as { email?: string }).email } : null
      })()
    : userTenant

  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  // 1. Obtener órdenes completadas pero no enviadas
  const { data: orders, error: ordersErr } = await supabase
    .from('order')
    .select('*, patient:patient_id(*)')
    .eq('tenant_id', tenant.tenant_id)
    .eq('status', 'completed')

  if (ordersErr) return NextResponse.json({ error: ordersErr.message }, { status: 500 })
  if (!orders || orders.length === 0) {
    return NextResponse.json({ error: 'No hay órdenes completadas pendientes' }, { status: 400 })
  }

  // 2. Obtener diagnósticos firmados para esas órdenes
  const orderIds = orders.map(o => o.id)
  const { data: diagnoses, error: dxErr } = await supabase
    .from('diagnosis')
    .select('*')
    .in('order_id', orderIds)
    .eq('is_signed', true)

  if (dxErr) return NextResponse.json({ error: dxErr.message }, { status: 500 })
  if (!diagnoses || diagnoses.length === 0) {
    return NextResponse.json({ error: 'No hay diagnósticos firmados pendientes de envío' }, { status: 400 })
  }

  const dxByOrder: Record<string, (typeof diagnoses)[0]> = {}
  for (const dx of diagnoses) {
    dxByOrder[dx.order_id] = dx
  }

  const validOrders = orders.filter(o => dxByOrder[o.id])
  if (validOrders.length === 0) {
    return NextResponse.json({ error: 'No hay diagnósticos firmados pendientes de envío' }, { status: 400 })
  }

  // 2. Obtener datos del laboratorio
  const { data: lab } = await supabase
    .schema('_public')
    .from('tenants')
    .select('name, email')
    .eq('id', tenant.tenant_id)
    .single()

  const labName = (lab as unknown as { name: string })?.name || 'Laboratorio'
  const labEmail = (lab as { email?: string } | undefined)?.email
  if (!labEmail) {
    return NextResponse.json({ error: 'El laboratorio no tiene email configurado' }, { status: 400 })
  }

  // 3. Obtener config de firma/sello
  const { data: tenantData } = await supabase
    .schema('_public')
    .from('tenants')
    .select('config')
    .eq('id', tenant.tenant_id)
    .single()

  const tenantConfig = (tenantData as unknown as { config: Record<string, unknown> })?.config || {}
  const signatureUrl = (tenantConfig.signature_url as string) || null
  const stampUrl = (tenantConfig.stamp_url as string) || null
  const showSignature = tenantConfig.show_signature !== false
  const showStamp = tenantConfig.show_stamp !== false
  const stampSizeMap: Record<string, number> = { sm: 48, md: 64, lg: 80 }
  const stampHeight = stampSizeMap[tenantConfig.stamp_size as string] || 64

  // 4. Generar PDFs para cada orden
  const attachments: { filename: string; content: Buffer }[] = []
  const summaryRows: string[] = []

  for (const order of validOrders) {
    const patient = order.patient
    const diagnosis = dxByOrder[order.id]

    const pdfBuffer = await generatePdfBuffer({
      labName,
      patient,
      order,
      diagnosis,
      signatureUrl,
      stampUrl,
      showSignature,
      showStamp,
      stampHeight,
    })

    attachments.push({
      filename: `diagnostico-${order.id.slice(0, 8)}.pdf`,
      content: Buffer.from(pdfBuffer),
    })

    const date = diagnosis.signed_at
      ? new Date(diagnosis.signed_at).toLocaleDateString('es-AR')
      : new Date(order.created_at).toLocaleDateString('es-AR')

    summaryRows.push(`
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${patient?.full_name || '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${patient?.dni || '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${date}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${diagnosis.general_category || '—'}</td>
      </tr>
    `)
  }

  // 5. Armar cuerpo del email con resumen y enlace al portal
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const labPortalUrl = `${baseUrl}/portal/lab`

  const html = `<!DOCTYPE html>
<html lang="es" style="margin:0;padding:0;background:#f4f5f7">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Resumen de diagnósticos - PAP Diagnóstico</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px">
<tr><td align="center">
  <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)">
    <tr>
      <td style="padding:32px 32px 0;text-align:center">
        <div style="width:48px;height:48px;margin:0 auto 16px;background:#f0f4ff;border-radius:12px;display:flex;align-items:center;justify-content:center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
        </div>
        <h1 style="margin:0 0 4px;font-size:18px;font-weight:700;color:#1e1e2e">Resumen de diagnósticos</h1>
        <p style="margin:0 0 20px;font-size:14px;color:#6b7280">${labName} — ${validOrders.length} diagnóstico${validOrders.length !== 1 ? 's' : ''} completado${validOrders.length !== 1 ? 's' : ''}</p>
      </td>
    </tr>
    <tr><td style="padding:0 32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:20px">
        <tr>
          <td style="padding:0;font-size:12px;color:#6b7280;font-weight:600;padding-bottom:8px">Resumen de diagnósticos emitidos</td>
        </tr>
        <tr><td style="padding:0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <thead>
              <tr style="background:#f3f4f6">
                <th style="padding:8px 12px;font-size:11px;color:#6b7280;text-align:left;text-transform:uppercase;letter-spacing:0.5px">Paciente</th>
                <th style="padding:8px 12px;font-size:11px;color:#6b7280;text-align:left;text-transform:uppercase;letter-spacing:0.5px">DNI</th>
                <th style="padding:8px 12px;font-size:11px;color:#6b7280;text-align:left;text-transform:uppercase;letter-spacing:0.5px">Fecha</th>
                <th style="padding:8px 12px;font-size:11px;color:#6b7280;text-align:left;text-transform:uppercase;letter-spacing:0.5px">Categoría</th>
              </tr>
            </thead>
            <tbody>
              ${summaryRows.join('')}
            </tbody>
          </table>
        </td></tr>
        <tr><td style="padding:16px 0 0;border-top:1px solid #e5e7eb;margin-top:12px">
          <p style="margin:0;font-size:13px;color:#1e1e2e;font-weight:600">
            Total: ${validOrders.length} diagnóstico${validOrders.length !== 1 ? 's' : ''}
          </p>
          <p style="margin:4px 0 0;font-size:12px;color:#6b7280">
            Fecha de emisión: ${new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:24px 32px 0;text-align:center">
      <a href="${labPortalUrl}"
         style="display:inline-block;padding:14px 32px;background:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px">
        Ir al portal del laboratorio
      </a>
      <p style="margin:12px 0 0;font-size:13px;color:#6b7280;line-height:1.5">
        Ingresá al portal para gestionar las órdenes, descargar los informes y ver el historial completo.
      </p>
      <p style="margin:8px 0 0;font-size:12px;color:#9ca3af">
        Los PDFs de cada diagnóstico se adjuntan en este mensaje.
      </p>
    </td></tr>
    <tr><td style="padding:24px 32px 32px;text-align:center">
      <p style="margin:0;font-size:12px;color:#9ca3af">
        PAP Diagnóstico &copy; ${new Date().getFullYear()} &mdash; Este es un mensaje automático
      </p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`

  // 6. Enviar email con PDFs adjuntos
  const result = await sendEmail(supabase, {
    to: labEmail,
    subject: `Resumen de diagnósticos — ${labName} (${validOrders.length} ${validOrders.length === 1 ? 'resultado' : 'resultados'})`,
    html,
    attachments,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  // 7. Marcar órdenes como entregadas
  const deliveredIds = validOrders.map(o => o.id)
  const { error: updateErr } = await supabase
    .from('order')
    .update({ status: 'delivered' })
    .in('id', deliveredIds)

  if (updateErr) {
    console.error('Error marcando órdenes como entregadas:', updateErr)
  }

  return NextResponse.json({ success: true, count: validOrders.length })
}