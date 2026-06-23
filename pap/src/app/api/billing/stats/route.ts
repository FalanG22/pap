import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'

export async function GET() {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  // Si es super_admin, devolver stats de todos los tenants
  if (tenant.role === 'super_admin') {
    const { data: tenants } = await supabase
      .schema('_public')
      .from('tenants')
      .select('id, name, slug')

    const result = await Promise.all((tenants || []).map(async (t) => {
      const [invoicesRes, configRes, pendingDxRes] = await Promise.all([
        supabase.from('invoice').select('*').eq('tenant_id', t.id),
        supabase.schema('_public').from('tenant_billing_config').select('*').eq('tenant_id', t.id).maybeSingle(),
        supabase.from('diagnosis').select('id', { count: 'exact', head: true })
          .eq('tenant_id', t.id).eq('is_signed', true).is('invoice_id', null),
      ])

      const invoices = invoicesRes.data || []
      const pendingDiagnoses = pendingDxRes.count || 0

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        cost_per_diagnosis: (configRes.data as unknown as { cost_per_diagnosis?: number })?.cost_per_diagnosis || 0,
        is_billing_active: (configRes.data as unknown as { is_active?: boolean })?.is_active || false,
        customer_doc_type: (configRes.data as unknown as { customer_doc_type?: number })?.customer_doc_type || null,
        customer_doc_number: (configRes.data as unknown as { customer_doc_number?: string })?.customer_doc_number || null,
        pending_diagnoses: pendingDiagnoses,
        pending: invoices?.filter(i => i.status === 'pending').length || 0,
        sent: invoices?.filter(i => i.status === 'sent').length || 0,
        paid: invoices?.filter(i => i.status === 'paid').length || 0,
        total_amount: invoices?.reduce((s, i) => s + Number(i.total_amount), 0) || 0,
        pending_amount: invoices?.filter(i => i.status === 'pending' || i.status === 'sent')
          .reduce((s, i) => s + Number(i.total_amount), 0) || 0,
      }
    }))

    return NextResponse.json(result)
  }

  // Lab view: stats de su propio tenant
  const [invoicesRes, configRes, pendingDxRes] = await Promise.all([
    supabase.from('invoice').select('*').eq('tenant_id', tenant.tenant_id),
    supabase.schema('_public').from('tenant_billing_config').select('*').eq('tenant_id', tenant.tenant_id).maybeSingle(),
    supabase.from('diagnosis').select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant.tenant_id).eq('is_signed', true).is('invoice_id', null),
  ])

  const invoices = invoicesRes.data || []
  const pendingDiagnoses = pendingDxRes.count || 0

  return NextResponse.json({
    pending_diagnoses: pendingDiagnoses,
    pending: invoices?.filter(i => i.status === 'pending').length || 0,
    sent: invoices?.filter(i => i.status === 'sent').length || 0,
    paid: invoices?.filter(i => i.status === 'paid').length || 0,
    cancelled: invoices?.filter(i => i.status === 'cancelled').length || 0,
    total_amount: invoices?.reduce((s, i) => s + Number(i.total_amount), 0) || 0,
    pending_amount: invoices?.filter(i => i.status === 'pending' || i.status === 'sent')
      .reduce((s, i) => s + Number(i.total_amount), 0) || 0,
    cost_per_diagnosis: (configRes.data as unknown as { cost_per_diagnosis?: number })?.cost_per_diagnosis || 0,
    is_billing_active: (configRes.data as unknown as { is_active?: boolean })?.is_active || false,
    currency: (configRes.data as unknown as { currency?: string })?.currency || 'ARS',
    customer_doc_type: (configRes.data as unknown as { customer_doc_type?: number })?.customer_doc_type || null,
    customer_doc_number: (configRes.data as unknown as { customer_doc_number?: string })?.customer_doc_number || null,
  })
}
