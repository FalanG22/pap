import * as forge from 'node-forge';
import * as crypto from 'crypto';

type Service = 'wsfe' | 'wsfex' | 'wsbfe';

const WSDL_URLS: Record<string, Record<Service, string>> = {
  homologacion: {
    wsfe: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
    wsfex: 'https://wswhomo.afip.gov.ar/wsfex/service.asmx',
    wsbfe: 'https://wswhomo.afip.gov.ar/wsbfe/service.asmx',
  },
  produccion: {
    wsfe: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx',
    wsfex: 'https://servicios1.afip.gov.ar/wsfex/service.asmx',
    wsbfe: 'https://servicios1.afip.gov.ar/wsbfe/service.asmx',
  },
};

const WSAA_URLS: Record<string, string> = {
  homologacion: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
  produccion: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
};

function toIsoString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}-03:00`;
}

function addTime(d: Date, hours: number): Date {
  return new Date(d.getTime() + hours * 60 * 60 * 1000);
}

function buildTra(service: Service): string {
  const now = new Date();
  const uniqueId = Math.floor(now.getTime() / 1000);
  const genTime = toIsoString(now);
  const expTime = toIsoString(addTime(now, 2));
  return `<?xml version="1.0" encoding="UTF-8"?><loginTicketRequest version="1.0"><header><uniqueId>${uniqueId}</uniqueId><generationTime>${genTime}</generationTime><expirationTime>${expTime}</expirationTime></header><service>${service}</service></loginTicketRequest>`;
}

function createCms(xml: string, certPem: string, keyPem: string): string {
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(xml, 'utf8');
  p7.addCertificate(certPem);
  p7.addSigner({ key: keyPem, certificate: certPem, digestAlgorithm: forge.pki.oids.sha1 });
  p7.sign({ detached: false });
  const pem = forge.pkcs7.messageToPem(p7);
  const lines = pem.split(/\r?\n/);
  return lines.filter(l => !l.startsWith('---') && l.trim() !== '').map(l => l.trim()).join('');
}

async function soapFetch(url: string, soapAction: string, bodyXml: string): Promise<string> {
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <soap:Body>
    ${bodyXml}
  </soap:Body>
</soap:Envelope>`;

  const headers: Record<string, string> = { 'Content-Type': 'text/xml; charset=utf-8' };
  if (soapAction !== undefined) headers['SOAPAction'] = soapAction;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: envelope,
  });

  return await res.text();
}

function extractXml(text: string, tag: string): string {
  const r = new RegExp(`<(?:[a-zA-Z0-9]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-zA-Z0-9]+:)?${tag}>`);
  const m = r.exec(text);
  return m ? m[1].trim() : '';
}

export async function autenticar(
  certPem: string, keyPem: string, keyPass: string | undefined, environment: string,
): Promise<{ token: string; sign: string }> {
  let pemToUse = keyPem;
  if (keyPass && keyPem.includes('ENCRYPTED')) {
    const decrypted = forge.pki.decryptRsaPrivateKey(keyPem, keyPass);
    if (!decrypted) throw new Error('No se pudo descifrar la clave privada. Verificá la passphrase.');
    pemToUse = forge.pki.privateKeyToPem(decrypted);
  }

  const xml = buildTra('wsfe');
  console.error('TRA XML:', xml);

  const cms = createCms(xml, certPem, pemToUse);
  console.error('CMS (first 100):', cms.substring(0, 100) + '...');

  const wsaaUrl = WSAA_URLS[environment] || WSAA_URLS.homologacion;
  const soapBody = `<loginCms xmlns="http://wsaa.view.sua.dvadac.nese.afip.gov.ar/xsd/"><in0>${cms}</in0></loginCms>`;

  const body = await soapFetch(wsaaUrl, '', soapBody);

  const taXml = extractXml(body, 'loginCmsReturn');
  if (taXml) {
    const decoded = taXml
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');
    const token = extractXml(decoded, 'token');
    const sign = extractXml(decoded, 'sign');
    if (token && sign) return { token, sign };
  }

  const fault = extractXml(body, 'faultstring') || '';
  const detail = extractXml(body, 'detail') || '';
  let errorMsg = 'No se pudo obtener el ticket de acceso.';
  if (fault) errorMsg += ` SOAP Fault: ${fault}`;
  if (detail) errorMsg += ` Detalle: ${detail}`;

  console.error('--- AFIP WSAA full response ---\n' + body);

  throw new Error(errorMsg);
}

export async function fedummy(environment: string, token: string, sign: string): Promise<{
  resultado: string; appServer: string; dbServer: string; authServer: string
}> {
  const url = WSDL_URLS[environment]?.wsfe || WSDL_URLS.homologacion.wsfe;
  const soapBody = `<FEDummy xmlns="http://ar.gov.afip.dif.FEV1/">
    <Auth>
      <Token>${token}</Token>
      <Sign>${sign}</Sign>
      <Cuit>20333922907</Cuit>
    </Auth>
  </FEDummy>`;

  const body = await soapFetch(url, 'http://ar.gov.afip.dif.FEV1/FEDummy', soapBody);
  const returnXml = extractXml(body, 'FEDummyResult');
  if (!returnXml) {
    const fault = extractXml(body, 'faultstring') || 'Respuesta inesperada';
    throw new Error(`Error FEDummy: ${fault}`);
  }
  return {
    resultado: extractXml(returnXml, 'Resultado') || 'OK',
    appServer: extractXml(returnXml, 'AppServer') || '',
    dbServer: extractXml(returnXml, 'DbServer') || '',
    authServer: extractXml(returnXml, 'AuthServer') || '',
  };
}

export type ComprobanteData = {
  cuit: string; puntoVenta: number; tipoComprobante: number; concepto: number;
  docTipo: number; docNro: string; importeNeto: number; importeIva: number;
  importeTotal: number; importeTributos?: number; ivaTipo?: number; fechaComprobante: string;
  cbteDesde?: number; cbteHasta?: number;
};

export type CaeResult = {
  cae: string; caeVto: string; comprobanteNumero: number; resultado: string; observaciones: string[];
};

export async function fecaeSolicitar(environment: string, token: string, sign: string, cuit: string, data: ComprobanteData): Promise<CaeResult> {
  const url = WSDL_URLS[environment]?.wsfe || WSDL_URLS.homologacion.wsfe;
  const ivaDet = data.importeNeto && data.importeIva !== undefined
    ? `<Iva><AlicIva><Id>${data.ivaTipo||5}</Id><BaseImp>${data.importeNeto.toFixed(2)}</BaseImp><Importe>${data.importeIva.toFixed(2)}</Importe></AlicIva></Iva>` : '';

  const soapBody = `<FECAESolicitar xmlns="http://ar.gov.afip.dif.FEV1/">
    <Auth><Token>${token}</Token><Sign>${sign}</Sign><Cuit>${cuit}</Cuit></Auth>
    <FeCAEReq>
      <FeCabReq><CantReg>1</CantReg><PtoVta>${data.puntoVenta}</PtoVta><CbteTipo>${data.tipoComprobante}</CbteTipo></FeCabReq>
      <FeDetReq>
        <FECAEDetRequest>
          <Concepto>${data.concepto}</Concepto><DocTipo>${data.docTipo}</DocTipo><DocNro>${data.docNro}</DocNro>
          <CbteDesde>${data.cbteDesde || 1}</CbteDesde><CbteHasta>${data.cbteHasta || 1}</CbteHasta><CbteFch>${data.fechaComprobante}</CbteFch>
          <ImpTotal>${data.importeTotal.toFixed(2)}</ImpTotal><ImpTotConc>0.00</ImpTotConc>
          <ImpNeto>${data.importeNeto.toFixed(2)}</ImpNeto><ImpOpEx>0.00</ImpOpEx>
          <ImpTrib>${(data.importeTributos||0).toFixed(2)}</ImpTrib><ImpIVA>${(data.importeIva||0).toFixed(2)}</ImpIVA>
          ${ivaDet}
        </FECAEDetRequest>
      </FeDetReq>
    </FeCAEReq>
  </FECAESolicitar>`;

  const body = await soapFetch(url, 'http://ar.gov.afip.dif.FEV1/FECAESolicitar', soapBody);
  const returnXml = extractXml(body, 'FECAESolicitarResult');
  if (!returnXml) {
    const fault = extractXml(body, 'faultstring') || 'Respuesta inesperada';
    throw new Error(`Error FECAESolicitar: ${fault}`);
  }
  const observaciones: string[] = [];
  const errorsXml = extractXml(returnXml, 'Errors');
  if (errorsXml) {
    const r = /<(?:[a-zA-Z0-9]+:)?Code>(\d+)<\/(?:[a-zA-Z0-9]+:)?Code>\s*<(?:[a-zA-Z0-9]+:)?Msg>([^<]+)<\/(?:[a-zA-Z0-9]+:)?Msg>/g;
    let m; while ((m = r.exec(errorsXml)) !== null) observaciones.push(`Error ${m[1]}: ${m[2]}`);
  }
  const feDetResp = extractXml(returnXml, 'FECAEDetResponse');
  if (!feDetResp && observaciones.length > 0) throw new Error(`AFIP rechazó: ${observaciones.join(' | ')}`);
  if (!feDetResp) throw new Error('No se obtuvo respuesta del servicio AFIP');
  const cae = extractXml(feDetResp, 'CAE');
  const caeVto = extractXml(feDetResp, 'CAEFchVto');
  const comprobanteNumero = parseInt(extractXml(feDetResp, 'CbteDesde') || '0');
  const resultado = extractXml(feDetResp, 'Resultado') || '';
  const obsXml = extractXml(feDetResp, 'Observaciones');
  if (obsXml) {
    const r = /<(?:[a-zA-Z0-9]+:)?Code>(\d+)<\/(?:[a-zA-Z0-9]+:)?Code>\s*<(?:[a-zA-Z0-9]+:)?Msg>([^<]+)<\/(?:[a-zA-Z0-9]+:)?Msg>/g;
    let m; while ((m = r.exec(obsXml)) !== null) observaciones.push(`Obs ${m[1]}: ${m[2]}`);
  }
  if (!cae) throw new Error(`AFIP rechazó: ${resultado}${observaciones.length?' — '+observaciones.join(', '):''}`);
  return { cae, caeVto, comprobanteNumero, resultado, observaciones };
}

export async function ultimoComprobante(environment: string, token: string, sign: string, cuit: string, puntoVenta: number, tipoComprobante: number): Promise<number> {
  const url = WSDL_URLS[environment]?.wsfe || WSDL_URLS.homologacion.wsfe;
  const soapBody = `<FECompUltimoAutorizado xmlns="http://ar.gov.afip.dif.FEV1/">
    <Auth><Token>${token}</Token><Sign>${sign}</Sign><Cuit>${cuit}</Cuit></Auth>
    <PtoVta>${puntoVenta}</PtoVta><CbteTipo>${tipoComprobante}</CbteTipo>
  </FECompUltimoAutorizado>`;

  const body = await soapFetch(url, 'http://ar.gov.afip.dif.FEV1/FECompUltimoAutorizado', soapBody);
  const resultXml = extractXml(body, 'FECompUltimoAutorizadoResult');
  if (!resultXml) {
    const fault = extractXml(body, 'faultstring') || 'Respuesta inesperada';
    throw new Error(`Error FECompUltimoAutorizado: ${fault}`);
  }
  return parseInt(extractXml(resultXml, 'CbteNro') || '0');
}
