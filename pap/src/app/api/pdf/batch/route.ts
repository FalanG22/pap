import { NextResponse } from 'next/server'
import { PassThrough } from 'stream'
import { createClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getUserTenant } from '@/lib/get-tenant'
import { generatePdfBuffer } from '@/lib/generate-pdf'
import { ZipArchive } from 'archiver'

export async function POST(request: Request) {
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  const { orderIds } = await request.json()
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return NextResponse.json({ error: 'orderIds es requerido' }, { status: 400 })
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: orders, error: ordersErr } = await supabase
    .from('order')
    .select('*, diagnosis(*)')
    .in('id', orderIds)
    .eq('tenant_id', tenant.tenant_id)

  if (ordersErr) return NextResponse.json({ error: ordersErr.message }, { status: 500 })
  if (!orders || orders.length === 0) {
    return NextResponse.json({ error: 'No se encontraron órdenes' }, { status: 404 })
  }

  const patientIds = orders.map(o => o.patient_id).filter(Boolean)
  const patientMap = new Map<string, { full_name: string; dni: string; birth_date?: string; sex?: string; email?: string; phone?: string }>()

  if (patientIds.length > 0) {
    const { data: patients } = await serviceSupabase
      .from('patient')
      .select('*')
      .in('id', patientIds)

    if (patients) {
      for (const p of patients) {
        patientMap.set(p.id, p)
      }
    }
  }

  const { data: lab } = await serviceSupabase
    .schema('_public')
    .from('tenants')
    .select('name')
    .eq('id', tenant.tenant_id)
    .single()

  const labName = (lab as unknown as { name: string })?.name || 'Laboratorio'

  const { data: tenantData } = await serviceSupabase
    .schema('_public')
    .from('tenants')
    .select('config')
    .eq('id', tenant.tenant_id)
    .single()

  const tenantConfig = (tenantData as unknown as { config: Record<string, unknown> })?.config || {}
  const signatureUrl = (tenantConfig.signature_url as string) || null
  const stampUrl = (tenantConfig.stamp_url as string) || null
  const showSignature = tenantConfig.show_signature !== false
  const showStamp = tenantConfig.show_stamp !== false
  const stampSizeMap: Record<string, number> = { sm: 48, md: 64, lg: 80 }
  const stampHeight = stampSizeMap[tenantConfig.stamp_size as string] || 64

  const passThrough = new PassThrough()
  const archive = new ZipArchive({ zlib: { level: 6 } })
  archive.pipe(passThrough)

  // feed PDFs to archive
  for (const order of orders) {
    const patient = patientMap.get(order.patient_id) || null
    const diagnosis = order.diagnosis || null
    const filename = `diagnostico-${patient?.full_name?.replace(/\s+/g, '_') || order.id.slice(0, 8)}.pdf`

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
      archive.append(Buffer.from(pdfBuffer), { name: filename })
    } catch {
      // skip individual PDF error
    }
  }

  await archive.finalize()

  return new NextResponse(passThrough as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="diagnosticos.zip"`,
    },
  })
}
