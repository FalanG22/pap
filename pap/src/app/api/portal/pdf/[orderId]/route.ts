import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { generatePdfBuffer } from '@/lib/generate-pdf'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const dni = request.nextUrl.searchParams.get('dni')
  const token = request.nextUrl.searchParams.get('token')

  if (!dni || !token) {
    return NextResponse.json({ error: 'Faltan parámetros de acceso' }, { status: 400 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )

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

  const [orderRes, diagnosisRes] = await Promise.all([
    supabase.from('order').select('*').eq('id', orderId).maybeSingle(),
    supabase.from('diagnosis').select('*').eq('order_id', orderId).maybeSingle(),
  ])

  const order = orderRes.data
  const diagnosis = diagnosisRes.data

  if (!order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  if (order.patient_id !== patient.id) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const fullPatient = await supabase
    .from('patient')
    .select('*')
    .eq('id', order.patient_id)
    .maybeSingle()

  const { data: lab } = await supabase
    .schema('_public')
    .from('tenants')
    .select('name')
    .eq('id', order.tenant_id)
    .single()

  const labName = (lab as unknown as { name: string })?.name || 'Laboratorio'

  const { data: tenantData } = await supabase
    .schema('_public')
    .from('tenants')
    .select('config')
    .eq('id', order.tenant_id)
    .single()

  const tenantConfig = (tenantData as unknown as { config: Record<string, unknown> })?.config || {}
  const signatureUrl = (tenantConfig.signature_url as string) || null
  const stampUrl = (tenantConfig.stamp_url as string) || null
  const showSignature = tenantConfig.show_signature !== false
  const showStamp = tenantConfig.show_stamp !== false
  const stampSizeMap: Record<string, number> = { sm: 48, md: 64, lg: 80 }
  const stampHeight = stampSizeMap[tenantConfig.stamp_size as string] || 64

  try {
    const pdfBuffer = await generatePdfBuffer({
      labName,
      patient: fullPatient.data || null,
      order,
      diagnosis,
      signatureUrl,
      stampUrl,
      showSignature,
      showStamp,
      stampHeight,
    })

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="diagnostico-${orderId.slice(0, 8)}.pdf"`,
      },
    })
  } catch (err) {
    console.error('Portal PDF generation error:', err)
    return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 })
  }
}
