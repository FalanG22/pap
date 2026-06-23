import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'

export async function GET(request: Request) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenant_id')
  const filter = searchParams.get('filter') // 'pending' | 'invoiced' | 'all'

  let targetTenantId = tenant.tenant_id
  if (tenant.role === 'super_admin' && tenantId) {
    targetTenantId = tenantId
  }

  let query = supabase
    .from('diagnosis')
    .select(`
      id, tenant_id, order_id, general_category, sample_quality, is_signed, signed_at, created_at,
      order:order_id(patient:patient_id(full_name, dni)),
      invoice:invoice_id(invoice_number, status, created_at)
    `)
    .eq('tenant_id', targetTenantId)
    .eq('is_signed', true)
    .order('signed_at', { ascending: false })

  if (filter === 'pending') {
    query = query.is('invoice_id', null)
  } else if (filter === 'invoiced') {
    query = query.not('invoice_id', 'is', null)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = (data as { [key: string]: unknown }[]).map((d) => {
    const order = d.order as { [key: string]: unknown } | undefined
    const patient = order?.patient as { [key: string]: unknown } | undefined
    const invoice = d.invoice as { [key: string]: unknown } | undefined
    return {
      id: d.id as string,
      tenant_id: d.tenant_id as string,
      order_id: d.order_id as string,
      patient_name: (patient?.full_name as string) || '—',
      patient_dni: (patient?.dni as string) || '—',
      general_category: d.general_category as string,
      sample_quality: d.sample_quality as string,
      signed_at: (d.signed_at as string) || null,
      invoice_id: (d.invoice_id as string) || null,
      invoice_number: (invoice?.invoice_number as string) || null,
      invoice_status: (invoice?.status as string) || null,
      created_at: d.created_at as string,
    }
  })

  return NextResponse.json(result)
}
