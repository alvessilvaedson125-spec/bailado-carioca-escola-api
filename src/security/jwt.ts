function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromBase64Url(str: string) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  if (pad) str += "=".repeat(4 - pad);

  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

export async function generateJWT(
  payload: any,
  secret: string,
  expiresInMs: number
) {
  if (!secret) {
    throw new Error("JWT secret is missing");
  }

  const header = { alg: "HS256", typ: "JWT" };
 const exp = Math.floor(Date.now() / 1000) + Math.floor(expiresInMs / 1000);

  const fullPayload = { ...payload, exp };

  const encoder = new TextEncoder();

  const headerEncoded = toBase64Url(
    encoder.encode(JSON.stringify(header))
  );

  const payloadEncoded = toBase64Url(
    encoder.encode(JSON.stringify(fullPayload))
  );

  const data = `${headerEncoded}.${payloadEncoded}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );

  const signatureEncoded = toBase64Url(
    new Uint8Array(signatureBuffer)
  );

  return `${data}.${signatureEncoded}`;
}

export async function verifyJWT(token: string, secret: string) {
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerEncoded, payloadEncoded, signatureEncoded] = parts;

  const data = `${headerEncoded}.${payloadEncoded}`;

  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(signatureEncoded),
    encoder.encode(data)
  );

  if (!valid) return null;

  const payloadBytes = fromBase64Url(payloadEncoded);
  const payload = JSON.parse(
    new TextDecoder().decode(payloadBytes)
  );

 if (!payload.exp) return null;

const exp = Number(payload.exp);

if (Math.floor(Date.now() / 1000) > exp) return null;

  return payload;
}