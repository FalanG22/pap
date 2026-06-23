import * as forge from 'node-forge';

const keypair = forge.pki.rsa.generateKeyPair(2048);
const cert = forge.pki.createCertificate();
cert.publicKey = keypair.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
const attrs = [{ name: 'commonName', value: 'test' }];
cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.sign(keypair.privateKey);

const xml = '<?xml version="1.0" encoding="UTF-8"?><loginTicketRequest version="1.0"><header><uniqueId>test</uniqueId><generationTime>2026-06-16T13:00:00-03:00</generationTime><expirationTime>2026-06-17T01:00:00-03:00</expirationTime></header><service>wsfe</service></loginTicketRequest>';

const p7 = forge.pkcs7.createSignedData();
p7.content = forge.util.createBuffer(xml, 'utf8');
p7.addCertificate(cert);
p7.addSigner({
  key: keypair.privateKey,
  certificate: cert,
  digestAlgorithm: forge.pki.oids.sha256,
  authenticatedAttributes: [
    { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
    { type: forge.pki.oids.messageDigest },
    { type: forge.pki.oids.signingTime },
  ],
});
p7.sign({ detached: false });

const pem = forge.pkcs7.messageToPem(p7);
console.log('=== PEM first 3 lines ===');
console.log(pem.split('\n').slice(0, 3).join('\n'));

const lines = pem.split('\n');
const b64 = lines.filter(l => !l.startsWith('---')).join('');
console.log('\n=== Base64 (first 100 chars) ===');
console.log(b64.substring(0, 100) + '...');

// Verificar que el XML esté en el DER
const der = forge.util.decode64(b64);
const derStr = der.toString('latin1');
console.log('\n=== XML embed check ===');
console.log('Contains loginTicketRequest:', derStr.includes('loginTicketRequest'));
console.log('Contains wsfe:', derStr.includes('wsfe'));
console.log('Content length:', der.length, 'bytes');

// Ver si el CMS tiene la estructura correcta
const buf = forge.util.createBuffer(der);
const asn1 = forge.asn1.fromDer(buf);
console.log('\n=== ASN.1 ===');
function printAsn1(node, depth) {
  if (!node) return;
  const spaces = '  '.repeat(depth);
  const tagName = forge.asn1.Type.nameForType(node.type) || node.type;
  const cls = node.tagClass === 0 ? 'UNIVERSAL' : node.tagClass === 2 ? 'CONTEXT' : 'APPLICATION';
  console.log(spaces + cls + ' ' + tagName + (node.constructed ? ' (constructed)' : ' (primitive)'));
  if (Array.isArray(node.value)) {
    node.value.forEach(c => printAsn1(c, depth + 1));
  } else if (node.value && typeof node.value === 'string') {
    console.log(spaces + '  value: ' + node.value.substring(0, 80) + '...');
  }
}
printAsn1(asn1, 0);
