import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'
import { autenticar, fecaeSolicitar, ultimoComprobante } from '@/lib/afip'

export async function POST(_request: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { invoiceId } = await params

  const { data: invoice } = await supabase
    .from('invoice')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
  if (invoice.tenant_id !== tenant.tenant_id && tenant.role !== 'super_admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let configTenantId = invoice.tenant_id
  let { data: config } = await supabase
    .schema('_public')
    .from('tenant_afip_config')
    .select('*')
    .eq('tenant_id', configTenantId)
    .maybeSingle()

  if (!config && tenant.role === 'super_admin' && tenant.tenant_id !== invoice.tenant_id) {
    configTenantId = tenant.tenant_id
    const r = await supabase
      .schema('_public')
      .from('tenant_afip_config')
      .select('*')
      .eq('tenant_id', configTenantId)
      .maybeSingle()
    config = r.data
  }

  if (!config) {
    return NextResponse.json({ error: 'Configuración AFIP no encontrada. Configurá los datos en Facturación > AFIP para este Doctor.' }, { status: 400 })
  }

  const cfg = config as unknown as {
    cuit: string;
    environment: string;
    certificate_crt: string;
    certificate_key: string;
    certificate_key_pass?: string;
    punto_venta: number;
    wsaa_token?: string | null;
    wsaa_sign?: string | null;
    wsaa_token_expires_at?: string | null;
  }

  if (!cfg.certificate_crt || !cfg.certificate_key) {
    return NextResponse.json({ error: 'Faltan los certificados electrónicos' }, { status: 400 })
  }

  // Obtener datos del cliente (laboratorio) desde billing config
  const { data: billingCfg } = await supabase
    .schema('_public')
    .from('tenant_billing_config')
    .select('customer_doc_type, customer_doc_number')
    .eq('tenant_id', invoice.tenant_id)
    .maybeSingle()

  const customerDocType = (billingCfg as unknown as { customer_doc_type?: number | null })?.customer_doc_type || 80
  const customerDocNumber = (billingCfg as unknown as { customer_doc_number?: string | null })?.customer_doc_number || cfg.cuit

  try {
    // Reusar TA cacheado si sigue vigente
    let token: string, sign: string
    const now = new Date()
    const cachedExpiry = cfg.wsaa_token_expires_at ? new Date(cfg.wsaa_token_expires_at) : null
    if (cfg.wsaa_token && cfg.wsaa_sign && cachedExpiry && cachedExpiry > now) {
      token = cfg.wsaa_token
      sign = cfg.wsaa_sign
    } else {
      const auth = await autenticar(cfg.certificate_crt, cfg.certificate_key, cfg.certificate_key_pass, cfg.environment)
      token = auth.token
      sign = auth.sign
      const expiresAt = new Date(now.getTime() + 10 * 60 * 60 * 1000).toISOString()
      await supabase
        .schema('_public')
        .from('tenant_afip_config')
        .update({ wsaa_token: token, wsaa_sign: sign, wsaa_token_expires_at: expiresAt })
        .eq('tenant_id', configTenantId)
    }

    const ultimoNro = await ultimoComprobante(
      cfg.environment, token, sign, cfg.cuit, cfg.punto_venta, 6,
    )

    const nuevoNro = ultimoNro + 1
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '')

    const total = Number(invoice.total_amount)
    const neto = Math.round((total / 1.21) * 100) / 100
    const iva = Math.round((total - neto) * 100) / 100

    const result = await fecaeSolicitar(cfg.environment, token, sign, cfg.cuit, {
      cuit: cfg.cuit,
      puntoVenta: cfg.punto_venta,
      tipoComprobante: 6,
      concepto: 2,
      docTipo: customerDocType,
      docNro: customerDocNumber,
      importeNeto: neto,
      importeIva: iva,
      importeTotal: total,
      fechaComprobante: fecha,
      ivaTipo: 5,
      cbteDesde: nuevoNro,
      cbteHasta: nuevoNro,
    })

    await supabase
      .from('invoice')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        notes: JSON.stringify({
          afip: {
            cae: result.cae,
            cae_vto: result.caeVto,
            comprobante_numero: result.comprobanteNumero,
            resultado: result.resultado,
            environment: cfg.environment,
            cuit: cfg.cuit,
            punto_venta: cfg.punto_venta,
            customer_doc_type: customerDocType,
            customer_doc_number: customerDocNumber,
          },
        }),
      })
      .eq('id', invoiceId)

    return NextResponse.json({
      success: true,
      invoice_number: invoice.invoice_number,
      afip: {
        cae: result.cae,
        cae_vto: result.caeVto,
        comprobante_numero: result.comprobanteNumero,
        resultado: result.resultado,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
