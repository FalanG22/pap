import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getUserTenant } from '@/lib/get-tenant'
import { renderToStream, Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import React from 'react'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1e1e2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1 solid #e5e7eb' },
  labName: { fontSize: 16, fontWeight: 'bold', color: '#4f46e5' },
  reportTitle: { fontSize: 14, color: '#6b7280' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 100, color: '#6b7280', fontSize: 10 },
  value: { flex: 1, fontSize: 10, fontWeight: 'bold' },
  divider: { borderBottom: '1 solid #e5e7eb', marginVertical: 16 },
  dxBox: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 16, marginTop: 8, lineHeight: 1.6, fontSize: 10 },
  signatureBox: { marginTop: 32, paddingTop: 16, borderTop: '1 solid #e5e7eb', flexDirection: 'row', justifyContent: 'space-between' },
  signatureLine: { width: 200, borderBottom: '1 solid #1e1e2e', marginBottom: 4 },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, textAlign: 'center', color: '#9ca3af', fontSize: 8, borderTop: '1 solid #e5e7eb', paddingTop: 8 },
  badge: { fontSize: 8, padding: '2 6', borderRadius: 4, color: '#059669', alignSelf: 'flex-start', marginTop: 8 },
})

const qualityMap: Record<string, string> = {
  adequate: 'Muestra adecuada para evaluación',
  inadequate: 'Muestra inadecuada para evaluación',
}
const sexMap: Record<string, string> = { male: 'Masculino', female: 'Femenino', other: 'Otro' }

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const supabase = await createClient()
  const tenant = await getUserTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'No auth' }, { status: 401 })

  // 1. Obtener orden + paciente por separado (evita RLS con embedded relations)
  const { data: order, error: orderErr } = await supabase
    .from('order')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  const { data: patient } = await supabase
    .from('patient')
    .select('*')
    .eq('id', order.patient_id)
    .single()

  // 2. Obtener diagnóstico por separado (misma query que /api/diagnosis/[orderId])
  const { data: diagnosis } = await supabase
    .from('diagnosis')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle()

  // 3. Nombre del laboratorio
  const { data: lab } = await supabase
    .schema('_public')
    .from('tenants')
    .select('name')
    .eq('id', tenant.tenant_id)
    .single()

  const labName = (lab as unknown as { name: string })?.name || 'Laboratorio'

  // 4. Obtener config de firma/sello
  const { data: tenantData } = await supabase
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

  // 5. Calcular datos derivados
  const age = patient?.birth_date
    ? `${Math.floor((Date.now() - new Date(patient.birth_date).getTime()) / 31557600000)} años`
    : '—'

  const sampleQuality = qualityMap[diagnosis?.sample_quality] || diagnosis?.sample_quality || '—'
  const generalCategory = diagnosis?.general_category || '—'
  const descriptiveDx = diagnosis?.descriptive_dx || '—'
  const isSigned = diagnosis?.is_signed || false
  const signedAt = diagnosis?.signed_at
    ? new Date(diagnosis.signed_at).toLocaleDateString('es-AR', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null
  const signature = diagnosis?.digital_signature || null
  const orderDate = new Date(order.created_at).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const pdfDoc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.labName}>{labName}</Text>
            <Text style={styles.reportTitle}>Informe de Citología PAP</Text>
          </View>
          <Text style={{ fontSize: 8, color: '#9ca3af' }}>{orderDate}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del paciente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.value}>{patient?.full_name || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>DNI</Text>
            <Text style={styles.value}>{patient?.dni || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Edad / Sexo</Text>
            <Text style={styles.value}>{age} · {sexMap[patient?.sex] || '—'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calidad de la muestra</Text>
          <Text style={{ fontSize: 10 }}>{sampleQuality}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categoría General</Text>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#4f46e5' }}>
            {generalCategory}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnóstico Descriptivo</Text>
          <View style={styles.dxBox}>
            <Text>{descriptiveDx}</Text>
          </View>
        </View>

        {isSigned && (
          <>
            <Text style={[
              styles.badge,
              { backgroundColor: generalCategory?.toLowerCase().includes('negativo') ? '#ecfdf5' : '#fffbeb' },
              { color: generalCategory?.toLowerCase().includes('negativo') ? '#059669' : '#d97706' },
            ]}>
              {generalCategory?.toLowerCase().includes('negativo')
                ? '✓ Resultado dentro de parámetros normales'
                : '⚠ Requiere seguimiento'}
            </Text>

            <View style={styles.signatureBox}>
              <View>
                <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 4 }}>Firma digital</Text>
                <Text style={{ fontSize: 8, fontFamily: 'Courier', color: '#6b7280' }}>
                  {signature}
                </Text>
                {(showSignature && signatureUrl) || (showStamp && stampUrl) ? (
                  <View style={{ flexDirection: 'row', gap: 16, marginTop: 12, alignItems: 'flex-end' }}>
                    {showSignature && signatureUrl && (
                      <Image src={signatureUrl} style={{ height: 36 }} />
                    )}
                    {showStamp && stampUrl && (
                      <Image src={stampUrl} style={{ height: stampHeight }} />
                    )}
                  </View>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={styles.signatureLine} />
                <Text style={{ fontSize: 9, color: '#6b7280' }}>{signedAt}</Text>
              </View>
            </View>
          </>
        )}

        <Text style={styles.footer}>
          PAP Diagnóstico — Este informe fue generado digitalmente
        </Text>
      </Page>
    </Document>
  )

  try {
    const stream = await renderToStream(pdfDoc)
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    const pdfBuffer = Buffer.concat(chunks)

    return new NextResponse(pdfBuffer, {
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
