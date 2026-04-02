const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export const AUTH_COOKIE_NAME = "bim-docs-session";
export const AUTH_COOKIE_MAX_AGE_SECONDS = Math.floor(SESSION_DURATION_MS / 1000);
export const DEFAULT_DOCS_PATH = "/en";

const encoder = new TextEncoder();
let signingKeyPromise: Promise<CryptoKey> | undefined;

function getSessionSecret() {
  const secret = import.meta.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing SESSION_SECRET environment variable.");
  }

  return secret;
}

async function getSigningKey() {
  signingKeyPromise ??= crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

  return signingKeyPromise;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string) {
  if (value.length % 2 !== 0 || !/^[a-f0-9]+$/i.test(value)) {
    return null;
  }

  const bytes = new Uint8Array(value.length / 2);

  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }

  return bytes;
}

export async function sign(data: string) {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));

  return bytesToHex(new Uint8Array(signature));
}

export async function createSession(expiresAt = Date.now() + SESSION_DURATION_MS) {
  const payload = String(expiresAt);
  const signature = await sign(payload);

  return `${payload}.${signature}`;
}

export async function verifySession(cookieValue: string | undefined | null) {
  if (!cookieValue) {
    return null;
  }

  const [payload, signature] = cookieValue.split(".");

  if (!payload || !signature || !/^\d+$/.test(payload)) {
    return null;
  }

  const expiresAt = Number(payload);

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return null;
  }

  const signatureBytes = hexToBytes(signature);

  if (!signatureBytes) {
    return null;
  }

  const key = await getSigningKey();
  const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(payload));

  if (!isValid) {
    return null;
  }

  return { expiresAt };
}
