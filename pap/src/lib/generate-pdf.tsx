import { renderToStream, Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import React from 'react'

async function fetchImageAsBase64(url: string): Promise<{ uri: string } | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Image fetch failed (${response.status}): ${url}`)
      return null
    }
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const ext = url.split('.').pop()?.toLowerCase() || 'png'
    const mime =
      ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
      : ext === 'svg' ? 'image/svg+xml'
      : 'image/png'
    return { uri: `data:${mime};base64,${base64}` }
  } catch (err) {
    console.error('Error fetching image:', err)
    return null
  }
}

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

export async function generatePdfBuffer(params: {
  labName: string
  patient: { full_name: string; dni: string; birth_date?: string; sex?: string; email?: string; phone?: string } | null
  order: { id: string; created_at: string }
  diagnosis: {
    id?: string
    sample_quality?: string
    general_category?: string
    descriptive_dx?: string
    is_signed?: boolean
    signed_at?: string
    digital_signature?: string
  } | null
  signatureUrl?: string | null
  stampUrl?: string | null
  showSignature?: boolean
  showStamp?: boolean
  stampHeight?: number
}): Promise<Uint8Array> {
  const { labName, patient, order, diagnosis, signatureUrl, stampUrl, showSignature = true, showStamp = true, stampHeight = 64 } = params

  const [signatureSrc, stampSrc] = await Promise.all([
    showSignature && signatureUrl ? fetchImageAsBase64(signatureUrl) : Promise.resolve(null),
    showStamp && stampUrl ? fetchImageAsBase64(stampUrl) : Promise.resolve(null),
  ])

  const age = patient?.birth_date
    ? `${Math.floor((Date.now() - new Date(patient.birth_date).getTime()) / 31557600000)} años`
    : '—'

  const sampleQuality = qualityMap[diagnosis?.sample_quality || ''] || diagnosis?.sample_quality || '—'
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
  const refNumber = order.id.slice(0, 8).toUpperCase()

  const pdfDoc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.labName}>{labName}</Text>
            <Text style={styles.reportTitle}>Informe de Citología PAP</Text>
            <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 4 }}>N° {refNumber}</Text>
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
            <Text style={styles.value}>{age} · {sexMap[patient?.sex || ''] || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{patient?.email || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Teléfono</Text>
            <Text style={styles.value}>{patient?.phone || '—'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={{ fontSize: 8, color: '#9ca3af', marginBottom: 4 }}>
          Diagnóstico ID: {diagnosis?.id ? diagnosis.id.slice(0, 8).toUpperCase() : '—'}
        </Text>

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
                {signatureSrc || stampSrc ? (
                  <View style={{ flexDirection: 'row', gap: 16, marginTop: 12, alignItems: 'flex-end' }}>
                    {signatureSrc && (
                      <Image src={signatureSrc} style={{ height: 36 }} />
                    )}
                    {stampSrc && (
                      <Image src={stampSrc} style={{ height: stampHeight }} />
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

  const stream = await renderToStream(pdfDoc)
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }
  return new Uint8Array(Buffer.concat(chunks))
}