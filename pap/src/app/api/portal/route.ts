import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { dni, token } = await request.json()

  // Buscar paciente por DNI
  const { data: patient, error: patientErr } = await supabase
    .from('patient')
    .select('id, full_name, dni, email')
    .eq('dni', dni.replace(/\./g, ''))
    .maybeSingle()

  if (patientErr || !patient) {
    return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 })
  }

  // Verificar token (puede estar en patient o en cualquier order)
  const { data: tokenOrder } = await supabase
    .from('order')
    .select('id')
    .eq('patient_id', patient.id)
    .eq('pdf_token', token)
    .maybeSingle()

  if (!tokenOrder) {
    return NextResponse.json({ error: 'Código de acceso inválido' }, { status: 403 })
  }

  // Obtener todas las órdenes del paciente con sus diagnósticos
  const { data: orders } = await supabase
    .from('order')
    .select('*, diagnosis(*)')
    .eq('patient_id', patient.id)
    .order('created_at', { ascending: false })

  const diagnoses = (orders || []).map(o => ({
    order_id: o.id,
    date: o.created_at,
    status: o.status,
    category: o.diagnosis?.[0]?.general_category || null,
    descriptive_dx: o.diagnosis?.[0]?.descriptive_dx || null,
    is_signed: o.diagnosis?.[0]?.is_signed || false,
    signed_at: o.diagnosis?.[0]?.signed_at || null,
  }))

  return NextResponse.json({
    patient_name: patient.full_name,
    patient_dni: patient.dni,
    diagnoses,
  })
}
