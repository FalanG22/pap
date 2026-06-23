import { renderToStream, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import React from 'react'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1e1e2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: '1 solid #e5e7eb' },
  headerLeft: {},
  title: { fontSize: 18, fontWeight: 'bold', color: '#4f46e5' },
  subtitle: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  number: { fontSize: 14, color: '#059669', fontWeight: 'bold' },
  cuitLabel: { fontSize: 7, color: '#9ca3af', marginTop: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  infoTable: { width: '100%' },
  infoRow: { flexDirection: 'row', marginBottom: 4, paddingVertical: 2 },
  infoLabel: { width: 120, color: '#6b7280', fontSize: 10 },
  infoValue: { flex: 1, fontSize: 10, fontWeight: 'bold' },
  divider: { borderBottom: '1 solid #e5e7eb', marginVertical: 12 },
  itemsTable: { marginTop: 8 },
  itemsHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: '6 8', borderRadius: 4, fontSize: 8, color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' },
  itemsRow: { flexDirection: 'row', padding: '8 8', fontSize: 10, borderBottom: '1 solid #f3f4f6' },
  colDesc: { flex: 3 },
  colQty: { width: 60, textAlign: 'center' },
  colPrice: { width: 80, textAlign: 'right' },
  colTotal: { width: 80, textAlign: 'right' },
  totalRow: { flexDirection: 'row', padding: '8 8', fontSize: 12, fontWeight: 'bold', backgroundColor: '#f9fafb', borderRadius: 4, marginTop: 4 },
  afipBox: { marginTop: 12, padding: 10, border: '1 solid #d1d5db', borderRadius: 4, backgroundColor: '#f9fafb' },
  afipTitle: { fontSize: 8, fontWeight: 'bold', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  afipRow: { flexDirection: 'row', marginBottom: 2, fontSize: 9 },
  afipLabel: { width: 100, color: '#6b7280' },
  afipValue: { flex: 1, fontWeight: 'bold', fontFamily: 'Courier', fontSize: 8 },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, textAlign: 'center', color: '#9ca3af', fontSize: 8, borderTop: '1 solid #e5e7eb', paddingTop: 8 },
  statusBadge: { fontSize: 8, padding: '2 6', borderRadius: 4, color: '#d97706', marginTop: 4 },
})

type AfipPdfData = {
  cuit: string;
  cae: string;
  cae_vto: string;
  comprobante_numero: number;
  punto_venta: number;
  environment: string;
  customer_doc_type?: number;
  customer_doc_number?: string;
}

export async function generateInvoicePdfBuffer(params: {
  labName: string
  invoiceNumber: string
  periodStart: string
  periodEnd: string
  totalDiagnoses: number
  unitCost: number
  totalAmount: number
  currency: string
  status: string
  createdAt: string
  afip?: AfipPdfData | null
}): Promise<Uint8Array> {
  const { labName, invoiceNumber, periodStart, periodEnd, totalDiagnoses, unitCost, totalAmount, currency, status, createdAt, afip } = params

  const tipoCompLabel = 'Factura B'
  const envLabel = afip?.environment === 'produccion' ? 'Producción' : 'Homologación'

  const pdfDoc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{labName}</Text>
            <Text style={styles.subtitle}>Servicios de Diagnóstico PAP</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.number}>{invoiceNumber}</Text>
            {afip && <Text style={styles.cuitLabel}>CUIT {afip.cuit}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de la Factura</Text>
          <View style={styles.infoTable}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>N° de factura</Text>
              <Text style={styles.infoValue}>{invoiceNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Período facturado</Text>
              <Text style={styles.infoValue}>{periodStart} — {periodEnd}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha de emisión</Text>
              <Text style={styles.infoValue}>{createdAt}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Estado</Text>
              <Text style={[styles.infoValue, { color: status === 'paid' ? '#059669' : status === 'sent' ? '#2563eb' : '#d97706' }]}>
                {status === 'paid' ? 'Pagada' : status === 'sent' ? 'Enviada' : status === 'cancelled' ? 'Anulada' : 'Pendiente'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle</Text>
          <View style={styles.itemsTable}>
            <View style={styles.itemsHeader}>
              <Text style={styles.colDesc}>Concepto</Text>
              <Text style={styles.colQty}>Cant.</Text>
              <Text style={styles.colPrice}>P. Unit.</Text>
              <Text style={styles.colTotal}>Total</Text>
            </View>
            <View style={styles.itemsRow}>
              <Text style={styles.colDesc}>Servicios de Diagnóstico PAP</Text>
              <Text style={styles.colQty}>{totalDiagnoses}</Text>
              <Text style={styles.colPrice}>{currency} {unitCost.toFixed(2)}</Text>
              <Text style={styles.colTotal}>{currency} {totalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.colDesc, { fontWeight: 'bold' }]}>Total</Text>
              <Text style={styles.colQty} />
              <Text style={styles.colPrice} />
              <Text style={[styles.colTotal, { color: '#059669', fontSize: 14 }]}>{currency} {totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {afip && (
          <View style={styles.afipBox}>
            <Text style={styles.afipTitle}>Comprobante Electrónico AFIP ({envLabel})</Text>
            <View style={styles.afipRow}>
              <Text style={styles.afipLabel}>Tipo</Text>
              <Text style={styles.afipValue}>{tipoCompLabel}</Text>
            </View>
            <View style={styles.afipRow}>
              <Text style={styles.afipLabel}>CUIT Emisor</Text>
              <Text style={styles.afipValue}>{afip.cuit}</Text>
            </View>
            {afip.customer_doc_number && (
              <View style={styles.afipRow}>
                <Text style={styles.afipLabel}>Cliente</Text>
                <Text style={styles.afipValue}>{afip.customer_doc_type === 96 ? 'DNI' : 'CUIT'} {afip.customer_doc_number}</Text>
              </View>
            )}
            <View style={styles.afipRow}>
              <Text style={styles.afipLabel}>Punto de Venta</Text>
              <Text style={styles.afipValue}>{String(afip.punto_venta).padStart(4, '0')}</Text>
            </View>
            <View style={styles.afipRow}>
              <Text style={styles.afipLabel}>N° Comprobante</Text>
              <Text style={styles.afipValue}>{String(afip.comprobante_numero).padStart(8, '0')}</Text>
            </View>
            <View style={styles.afipRow}>
              <Text style={styles.afipLabel}>CAE</Text>
              <Text style={[styles.afipValue, { color: '#059669' }]}>{afip.cae}</Text>
            </View>
            <View style={styles.afipRow}>
              <Text style={styles.afipLabel}>Vto. CAE</Text>
              <Text style={styles.afipValue}>{afip.cae_vto}</Text>
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          PAP Diagnóstico — Factura generada automáticamente el {createdAt}
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
