export type EmailData = {
  labName: string;
  patientName: string;
  patientDni: string;
  diagnosisDate: string;
  generalCategory: string;
  portalUrl: string;
  accessToken: string;
};

export function renderResultEmail(data: EmailData): string {
  const {
    labName,
    patientName,
    patientDni,
    diagnosisDate,
    generalCategory,
    portalUrl,
    accessToken,
  } = data;

  return `<!DOCTYPE html>
<html lang="es" style="margin:0;padding:0;background:#f4f5f7">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Resultado disponible - PAP Diagnóstico</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px">
<tr><td align="center">
  <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)">
    <tr>
      <td style="padding:32px 32px 0;text-align:center">
        <div style="width:48px;height:48px;margin:0 auto 16px;background:#f0f4ff;border-radius:12px;display:flex;align-items:center;justify-content:center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
        </div>
        <h1 style="margin:0 0 4px;font-size:18px;font-weight:700;color:#1e1e2e">Resultado disponible</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#6b7280">${labName} ha publicado un nuevo resultado</p>
      </td>
    </tr>
    <tr><td style="padding:0 32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:20px">
        <tr>
          <td style="padding:0 0 12px">
            <table role="presentation" width="100%">
              <tr>
                <td style="padding:0;font-size:12px;color:#6b7280;line-height:1.5">Paciente</td>
                <td style="padding:0;font-size:12px;color:#6b7280;line-height:1.5;text-align:right">Fecha</td>
              </tr>
              <tr>
                <td style="padding:0;font-size:15px;font-weight:600;color:#1e1e2e">${patientName}</td>
                <td style="padding:0;font-size:15px;font-weight:600;color:#1e1e2e;text-align:right">${diagnosisDate}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="border-top:1px solid #e5e7eb;margin:8px 0"></td></tr>
        <tr>
          <td style="padding:12px 0 0">
            <table role="presentation" width="100%">
              <tr>
                <td style="padding:0;font-size:12px;color:#6b7280;line-height:1.5">DNI</td>
                <td style="padding:0;font-size:12px;color:#6b7280;line-height:1.5;text-align:right">Categoría</td>
              </tr>
              <tr>
                <td style="padding:0;font-size:15px;font-weight:600;color:#1e1e2e">${patientDni}</td>
                <td style="padding:0;font-size:15px;font-weight:600;color:#1e1e2e;text-align:right">${generalCategory}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:24px 32px 0;text-align:center">
      <a href="${portalUrl}?token=${accessToken}&dni=${encodeURIComponent(patientDni)}"
         style="display:inline-block;padding:14px 32px;background:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px">
        Ver resultado completo
      </a>
      <p style="margin:12px 0 0;font-size:13px;color:#6b7280;line-height:1.5">
        Hacé clic en el botón para acceder al portal seguro y visualizar el informe completo de PAP.
      </p>
    </td></tr>
    <tr><td style="padding:24px 32px 32px;text-align:center">
      <p style="margin:0;font-size:12px;color:#9ca3af">
        PAP Diagnóstico &copy; ${new Date().getFullYear()} &mdash; Este es un mensaje automático
      </p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`
}
