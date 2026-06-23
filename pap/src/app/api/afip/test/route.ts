import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'
import { autenticar, fedummy } from '@/lib/afip'

export async function POST(request: Request) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenant_id')

  let targetTenantId = tenant.tenant_id
  if (tenant.role === 'super_admin' && tenantId) {
    targetTenantId = tenantId
  }

  const { data: config } = await supabase
    .schema('_public')
    .from('tenant_afip_config')
    .select('*')
    .eq('tenant_id', targetTenantId)
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
    wsaa_token?: string | null;
    wsaa_sign?: string | null;
    wsaa_token_expires_at?: string | null;
  }

  try {
    // Reusar TA cacheado si vigente
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
        .eq('tenant_id', targetTenantId)
    }

    const result = await fedummy(cfg.environment, token, sign)

    return NextResponse.json({
      success: true,
      message: 'Conexión AFIP exitosa',
      wsaa: { authenticated: true },
      fedummy: {
        resultado: result.resultado,
        appServer: result.appServer,
        dbServer: result.dbServer,
        authServer: result.authServer,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
