// Protection SSRF : empêche d'ajouter/fetcher un "flux" pointant vers le réseau interne
const dns = require('dns').promises;
const net = require('net');
const AppError = require('./AppError');

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return isPrivateIp(v6.slice(7)); // IPv4 mappée
  return v6 === '::1' || v6 === '::' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80');
}

async function assertSafeUrl(rawUrl) {
  let host;
  try {
    host = new URL(rawUrl).hostname.replace(/^\[|\]$/g, '');
  } catch {
    throw new AppError(400, 'URL invalide');
  }
  const addresses = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (addresses.some((a) => isPrivateIp(a.address))) {
    throw new AppError(400, 'Cette adresse n’est pas autorisée');
  }
}

module.exports = { assertSafeUrl, isPrivateIp };
