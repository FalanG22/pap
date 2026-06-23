import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'

export async function GET(request: Request) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenant_id')
  const status = searchParams.get('status')

  let filterTenantId = tenant.tenant_id
  if (tenant.role === 'super_admin' && tenantId) {
    filterTenantId = tenantId
  }

  let query = supabase
    .from('invoice')
    .select('*')
    .eq('tenant_id', filterTenantId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })
  if (tenant.role !== 'super_admin' && tenant.role !== 'lab_admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await request.json()
  const targetTenantId = body.tenant_id || tenant.tenant_id

  if (tenant.role !== 'super_admin' && targetTenantId !== tenant.tenant_id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data: config } = await supabase
    .schema('_public')
    .from('tenant_billing_config')
    .select('*')
    .eq('tenant_id', targetTenantId)
    .maybeSingle()

  if (!config) {
    return NextResponse.json({ error: 'Configuración de facturación no encontrada. Configurá el costo por diagnóstico primero.' }, { status: 400 })
  }

  const c = config as unknown as { cost_per_diagnosis: number; currency: string; invoice_prefix: string; billing_email?: string }
  const costPerDiagnosis = Number(c.cost_per_diagnosis)

  let diagnoses: { id: string; signed_at: string }[] | null
  let periodStart: string
  let periodEnd: string

  if (body.diagnosis_ids) {
    // Modo selección manual: usar los IDs enviados
    const diagnosisIds: string[] = body.diagnosis_ids
    if (!Array.isArray(diagnosisIds) || diagnosisIds.length === 0) {
      return NextResponse.json({ error: 'Seleccioná al menos un diagnóstico' }, { status: 400 })
    }

    const { data: dxList } = await supabase
      .from('diagnosis')
      .select('id, signed_at')
      .eq('tenant_id', targetTenantId)
      .eq('is_signed', true)
      .is('invoice_id', null)
      .in('id', diagnosisIds)

    if (!dxList || dxList.length === 0) {
      return NextResponse.json({ error: 'Ninguno de los diagnósticos seleccionados está disponible para facturar (ya facturados o no firmados)' }, { status: 400 })
    }

    if (dxList.length !== diagnosisIds.length) {
      return NextResponse.json({ error: 'Algunos diagnósticos seleccionados ya no están disponibles' }, { status: 400 })
    }

    diagnoses = dxList
    const dates = dxList.map(d => d.signed_at).filter(Boolean) as string[]
    periodStart = dates.length > 0 ? dates.sort()[0].split('T')[0] : new Date().toISOString().split('T')[0]
    periodEnd = dates.length > 0 ? dates.sort()[dates.length - 1].split('T')[0] : new Date().toISOString().split('T')[0]
  } else {
    // Modo período: usar rango de fechas
    periodStart = body.period_start
    periodEnd = body.period_end

    if (!periodStart || !periodEnd) {
      return NextResponse.json({ error: 'period_start y period_end son requeridos' }, { status: 400 })
    }

    const { data: dxList } = await supabase
      .from('diagnosis')
      .select('id, signed_at')
      .eq('tenant_id', targetTenantId)
      .eq('is_signed', true)
      .is('invoice_id', null)
      .gte('signed_at', periodStart + 'T00:00:00Z')
      .lte('signed_at', periodEnd + 'T23:59:59Z')

    diagnoses = dxList
  }

  const totalDiagnoses = diagnoses?.length || 0
  if (totalDiagnoses === 0) {
    return NextResponse.json({ error: 'No hay diagnósticos firmados pendientes de facturación' }, { status: 400 })
  }

  const totalAmount = totalDiagnoses * costPerDiagnosis

  // Generar número de factura
  const { data: invNum } = await supabase
    .schema('_public')
    .rpc('generate_invoice_number', { p_tenant_id: targetTenantId })

  const invoiceNumber = invNum as unknown as string
  if (!invoiceNumber) {
    return NextResponse.json({ error: 'Error generando número de factura' }, { status: 500 })
  }

  // Crear la factura
  const { data: invoice, error: invError } = await supabase
    .from('invoice')
    .insert({
      tenant_id: targetTenantId,
      invoice_number: invoiceNumber,
      period_start: periodStart,
      period_end: periodEnd,
      total_diagnoses: totalDiagnoses,
      unit_cost: costPerDiagnosis,
      total_amount: totalAmount,
      status: 'pending',
    })
    .select()
    .single()

  if (invError) return NextResponse.json({ error: invError.message }, { status: 500 })

  // Vincular cada diagnóstico a la factura
  const diagnosisIds = diagnoses!.map(d => d.id)
  const { error: linkError } = await supabase
    .from('diagnosis')
    .update({ invoice_id: invoice.id })
    .in('id', diagnosisIds)

  if (linkError) {
    // Si falla el vínculo, eliminamos la factura para evitar orphan
    await supabase.from('invoice').delete().eq('id', invoice.id)
    return NextResponse.json({ error: 'Error al vincular diagnósticos: ' + linkError.message }, { status: 500 })
  }

  return NextResponse.json(invoice)
}
