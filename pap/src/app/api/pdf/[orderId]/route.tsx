import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUserTenant } from '@/lib/get-tenant'
import { generatePdfBuffer } from '@/lib/generate-pdf'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { data: order, error: orderErr } = await supabase
    .from('order')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [patientRes, diagnosisRes] = await Promise.all([
    order.patient_id
      ? serviceSupabase.from('patient').select('*').eq('id', order.patient_id).maybeSingle()
      : Promise.resolve({ data: null }),
    serviceSupabase.from('diagnosis').select('*').eq('order_id', orderId).maybeSingle(),
  ])

  const patient = patientRes.data || null
  const diagnosis = diagnosisRes.data || null

  const { data: lab } = await serviceSupabase
    .schema('_public')
    .from('tenants')
    .select('name')
    .eq('id', order.tenant_id)
    .single()

  const labName = (lab as unknown as { name: string })?.name || 'Laboratorio'

  const { data: tenantData } = await serviceSupabase
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
      patient,
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
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 })
  }
}
