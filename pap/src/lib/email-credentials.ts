export function renderCredentialsEmail(data: {
  fullName: string;
  email: string;
  password: string;
  loginUrl: string;
  labName: string;
}): string {
  const { fullName, email, password, loginUrl, labName } = data;

  return `<!DOCTYPE html>
<html lang="es" style="margin:0;padding:0;background:#f4f5f7">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Credenciales de acceso - PAP Diagnóstico</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px">
<tr><td align="center">
  <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04)">
    <tr>
      <td style="padding:32px 32px 0;text-align:center">
        <div style="width:48px;height:48px;margin:0 auto 16px;background:#f0f4ff;border-radius:12px;display:flex;align-items:center;justify-content:center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h1 style="margin:0 0 4px;font-size:18px;font-weight:700;color:#1e1e2e">Acceso a PAP Diagnóstico</h1>
        <p style="margin:0 0 24px;font-size:14px;color:#6b7280">${labName} te ha dado acceso al sistema</p>
      </td>
    </tr>
    <tr><td style="padding:0 32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:20px">
        <tr>
          <td style="padding-bottom:8px">
            <p style="margin:0;font-size:12px;color:#6b7280">Usuario</p>
            <p style="margin:2px 0 0;font-size:15px;font-weight:600;color:#1e1e2e">${email}</p>
          </td>
        </tr>
        <tr><td style="border-top:1px solid #e5e7eb;margin:4px 0"></td></tr>
        <tr>
          <td style="padding-top:12px">
            <p style="margin:0;font-size:12px;color:#6b7280">Contraseña</p>
            <div style="margin:4px 0 0;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px;text-align:center">
              <code style="font-size:20px;font-weight:700;letter-spacing:3px;color:#1e1e2e;font-family:'Courier New',monospace">${password}</code>
            </div>
            <p style="margin:8px 0 0;font-size:12px;color:#6b7280">Recomendamos cambiar la contraseña luego del primer ingreso.</p>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:24px 32px 0;text-align:center">
      <a href="${loginUrl}"
         style="display:inline-block;padding:14px 32px;background:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px">
        Ingresar al sistema
      </a>
      <p style="margin:12px 0 0;font-size:13px;color:#6b7280;line-height:1.5">
        Hacé clic en el botón para acceder con tus credenciales.<br>
        Si el botón no funciona, copiá este enlace en tu navegador:<br>
        <a href="${loginUrl}" style="color:#4f46e5;font-size:12px;word-break:break-all">${loginUrl}</a>
      </p>
    </td></tr>
    <tr><td style="padding:20px 32px 0;text-align:center">
      <div style="background:#f0f4ff;border-radius:8px;padding:14px;text-align:left">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#4f46e5">📋 Instructivo rápido</p>
        <ol style="margin:0;padding-left:18px;font-size:12px;color:#6b7280;line-height:1.7">
          <li>Ingresá al sistema con tu email y la contraseña de arriba</li>
          <li>Gestioná las órdenes y diagnósticos de PAP</li>
          <li>Podés ver el historial completo de cada paciente</li>
          <li>Los resultados se pueden enviar automáticamente al paciente</li>
        </ol>
      </div>
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
