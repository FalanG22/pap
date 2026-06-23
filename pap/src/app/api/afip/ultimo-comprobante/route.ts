import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'
import { autenticar, ultimoComprobante } from '@/lib/afip'

export async function GET() {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { data: config } = await supabase
    .schema('_public')
    .from('tenant_afip_config')
    .select('*')
    .eq('tenant_id', tenant.tenant_id)
    .maybeSingle()

  if (!config) {
    return NextResponse.json({ error: 'Configuración AFIP no encontrada' }, { status: 400 })
  }

  const cfg = config as unknown as {
    cuit: string;
    environment: string;
    certificate_crt: string;
    certificate_key: string;
    certificate_key_pass?: string;
    punto_venta: number;
  }

  if (!cfg.certificate_crt || !cfg.certificate_key) {
    return NextResponse.json({ error: 'Faltan los certificados' }, { status: 400 })
  }

  try {
    const auth = await autenticar(cfg.certificate_crt, cfg.certificate_key, cfg.certificate_key_pass, cfg.environment)

    const ultimoNro = await ultimoComprobante(
      cfg.environment, auth.token, auth.sign, cfg.cuit, cfg.punto_venta, 6,
    )

    return NextResponse.json({
      success: true,
      ultimo_comprobante: ultimoNro,
      proximo: ultimoNro + 1,
      punto_venta: cfg.punto_venta,
      environment: cfg.environment,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
