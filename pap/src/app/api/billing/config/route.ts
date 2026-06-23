import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'

export async function GET() {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { data } = await supabase
    .schema('_public')
    .from('tenant_billing_config')
    .select('*')
    .eq('tenant_id', tenant.tenant_id)
    .maybeSingle()

  return NextResponse.json(data || null)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })
  if (tenant.role !== 'super_admin' && tenant.role !== 'lab_admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json()

  // Super admin puede editar la config de cualquier tenant
  const targetTenantId = (tenant.role === 'super_admin' && body.tenant_id)
    ? body.tenant_id
    : tenant.tenant_id
  if (tenant.role !== 'super_admin' && targetTenantId !== tenant.tenant_id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const allowedFields: Record<string, unknown> = {}
  if (body.cost_per_diagnosis !== undefined) allowedFields.cost_per_diagnosis = body.cost_per_diagnosis
  if (body.currency !== undefined) allowedFields.currency = body.currency
  if (body.billing_email !== undefined) allowedFields.billing_email = body.billing_email
  if (body.billing_frequency !== undefined) allowedFields.billing_frequency = body.billing_frequency
  if (body.billing_day !== undefined) allowedFields.billing_day = body.billing_day
  if (body.custom_days !== undefined) allowedFields.custom_days = body.custom_days
  if (body.invoice_prefix !== undefined) allowedFields.invoice_prefix = body.invoice_prefix
  if (body.is_active !== undefined) allowedFields.is_active = body.is_active
  if (body.notes !== undefined) allowedFields.notes = body.notes
  if (body.customer_doc_type !== undefined) allowedFields.customer_doc_type = body.customer_doc_type
  if (body.customer_doc_number !== undefined) allowedFields.customer_doc_number = body.customer_doc_number

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json({ error: 'Sin campos para actualizar' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .schema('_public')
    .from('tenant_billing_config')
    .select('id')
    .eq('tenant_id', targetTenantId)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .schema('_public')
      .from('tenant_billing_config')
      .update(allowedFields)
      .eq('tenant_id', targetTenantId)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .schema('_public')
    .from('tenant_billing_config')
    .insert({ tenant_id: targetTenantId, ...allowedFields })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
