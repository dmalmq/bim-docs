const AUTH_COOKIE_NAME = "bim-docs-session";
const DEFAULT_DOCS_PATH = "/en";

const encoder = new TextEncoder();
let signingKeyPromise: Promise<CryptoKey> | undefined;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

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
    ["verify"],
  );

  return signingKeyPromise;
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

function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return undefined;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = cookie.trim().split("=");

    if (rawName === name) {
      return rawValueParts.join("=");
    }
  }

  return undefined;
}

async function verifySession(cookieValue: string | undefined) {
  if (!cookieValue) {
    return false;
  }

  const [payload, signature] = cookieValue.split(".");

  if (!payload || !signature || !/^\d+$/.test(payload)) {
    return false;
  }

  const expiresAt = Number(payload);

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return false;
  }

  const signatureBytes = hexToBytes(signature);

  if (!signatureBytes) {
    return false;
  }

  const key = await getSigningKey();
  return crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(payload));
}

function isPublicPath(pathname: string) {
  return pathname === "/login" ||
    pathname === "/login/" ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.svg";
}

function buildLoginRedirect(url: URL) {
  const loginUrl = new URL("/login", url);
  const nextPath = url.pathname === "/" ? DEFAULT_DOCS_PATH : `${url.pathname}${url.search}`;

  if (nextPath !== DEFAULT_DOCS_PATH) {
    loginUrl.searchParams.set("next", nextPath);
  }

  return loginUrl;
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);

  if (isPublicPath(url.pathname)) {
    return;
  }

  try {
    const session = await verifySession(getCookieValue(request, AUTH_COOKIE_NAME));

    if (session) {
      if (url.pathname === "/") {
        return Response.redirect(new URL(DEFAULT_DOCS_PATH, url), 302);
      }

      return;
    }
  } catch (_error) {
    // Fall through to login if auth is misconfigured or verification fails.
  }

  return Response.redirect(buildLoginRedirect(url), 302);
}
