import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  const { dni, token } = await request.json()

  const { data: patient, error: patientErr } = await supabase
    .from('patient')
    .select('id, full_name, dni')
    .eq('dni', dni.replace(/\./g, ''))
    .maybeSingle()

  if (patientErr || !patient) {
    return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
  }

  const { data: tokenOrder } = await supabase
    .from('order')
    .select('id')
    .eq('patient_id', patient.id)
    .eq('pdf_token', token)
    .maybeSingle()

  if (!tokenOrder) {
    return NextResponse.json({ error: 'Código de acceso inválido' }, { status: 403 })
  }

  const { data: orders, error: ordersErr } = await supabase
    .from('order')
    .select('id, created_at, status')
    .eq('patient_id', patient.id)
    .order('created_at', { ascending: false })

  if (ordersErr) {
    return NextResponse.json({ error: 'Error al obtener órdenes' }, { status: 500 })
  }

  const orderIds = (orders || []).map(o => o.id)

  let dxByOrder: Record<string, Record<string, unknown>> = {}
  if (orderIds.length > 0) {
    const { data: diagnoses, error: dxErr } = await supabase
      .from('diagnosis')
      .select('*')
      .in('order_id', orderIds)

    if (dxErr) {
      return NextResponse.json({ error: 'Error al obtener diagnósticos: ' + dxErr.message }, { status: 500 })
    }

    if (diagnoses) {
      for (const dx of diagnoses) {
        dxByOrder[dx.order_id] = dx
      }
    }
  }

  const result = (orders || []).map(o => {
    const dx = dxByOrder[o.id] || null
    return {
      order_id: o.id,
      date: o.created_at,
      status: o.status,
      category: dx?.general_category || null,
      descriptive_dx: dx?.descriptive_dx || null,
      is_signed: dx?.is_signed || false,
      signed_at: dx?.signed_at || null,
    }
  })

  return NextResponse.json({
    patient_name: patient.full_name,
    patient_dni: patient.dni,
    diagnoses: result,
    _raw: {
      orders_count: orders?.length || 0,
      order_ids: orderIds,
      diagnoses_count: Object.keys(dxByOrder).length,
      diagnosis_keys: Object.keys(dxByOrder),
    },
  })
}
