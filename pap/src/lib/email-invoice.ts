export type InvoiceEmailData = {
  labName: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  totalDiagnoses: number;
  unitCost: number;
  totalAmount: number;
  currency: string;
};

export function renderInvoiceEmail(data: InvoiceEmailData): string {
  const {
    labName, invoiceNumber, periodStart, periodEnd,
    totalDiagnoses, unitCost, totalAmount, currency,
  } = data;

  return `<!DOCTYPE html>
<html lang="es" style="margin:0;padding:0;background:#f4f5f7">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Factura ${invoiceNumber} - PAP Diagnóstico</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px">
<tr><td align="center">
  <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)">
    <tr>
      <td style="padding:32px 32px 0;text-align:center">
        <div style="width:48px;height:48px;margin:0 auto 16px;background:#f0fdf4;border-radius:12px;display:flex;align-items:center;justify-content:center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        </div>
        <h1 style="margin:0 0 4px;font-size:18px;font-weight:700;color:#1e1e2e">Factura ${invoiceNumber}</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#6b7280">${labName}</p>
      </td>
    </tr>
    <tr><td style="padding:0 32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:20px">
        <tr>
          <td style="padding:0;font-size:12px;color:#6b7280;padding-bottom:8px;font-weight:600">Período facturado</td>
        </tr>
        <tr>
          <td style="padding:0 0 16px;font-size:16px;font-weight:600;color:#1e1e2e">${periodStart} — ${periodEnd}</td>
        </tr>
        <tr><td style="border-top:1px solid #e5e7eb;padding:12px 0 0"></td></tr>
        <tr>
          <td style="padding:8px 0">
            <table role="presentation" width="100%">
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#6b7280">Diagnósticos realizados</td>
                <td style="padding:4px 0;font-size:13px;color:#1e1e2e;font-weight:600;text-align:right">${totalDiagnoses}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#6b7280">Costo por diagnóstico</td>
                <td style="padding:4px 0;font-size:13px;color:#1e1e2e;font-weight:600;text-align:right">${currency} ${unitCost.toFixed(2)}</td>
              </tr>
              <tr><td style="padding:4px 0;border-top:2px solid #e5e7eb"></td></tr>
              <tr>
                <td style="padding:8px 0 0;font-size:15px;color:#1e1e2e;font-weight:700">Total</td>
                <td style="padding:8px 0 0;font-size:18px;color:#16a34a;font-weight:700;text-align:right">${currency} ${totalAmount.toFixed(2)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:24px 32px 32px;text-align:center">
      <p style="margin:0;font-size:12px;color:#9ca3af">
        PAP Diagnóstico &copy; ${new Date().getFullYear()} &mdash; Factura generada automáticamente
      </p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`
}
