export function validatePublicKeyPem(pem) {
  if (!pem) return { ok: false, reason: "Empty PEM" };

  const s = pem.trim();
  const hasBegin = s.includes("-----BEGIN PUBLIC KEY-----");
  const hasEnd = s.includes("-----END PUBLIC KEY-----");

  if (!hasBegin || !hasEnd) {
    return { ok: false, reason: "PEM must contain BEGIN/END PUBLIC KEY" };
  }

  if (s.length > 20000) {
    return { ok: false, reason: "PEM too large" };
  }

  return { ok: true };
}

