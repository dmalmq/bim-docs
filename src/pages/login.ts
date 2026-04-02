import type { APIRoute } from "astro";
import {
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_COOKIE_NAME,
  DEFAULT_DOCS_PATH,
  createSession,
  verifySession,
} from "../lib/auth";

export const prerender = false;

const SITE_PASSWORD = import.meta.env.SITE_PASSWORD;

function getSafeRedirectTarget(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_DOCS_PATH;
  }

  return value;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderLoginPage({ errorMessage, next }: { errorMessage?: string; next: string }) {
  const escapedNext = escapeHtml(next);
  const escapedError = errorMessage ? `<p class="error">${escapeHtml(errorMessage)}</p>` : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login | BIM Tutorials</title>
    <style>
      :root {
        color-scheme: dark;
        --background: #0b1120;
        --panel: rgba(15, 23, 42, 0.92);
        --panel-border: rgba(148, 163, 184, 0.2);
        --text: #e2e8f0;
        --muted: #94a3b8;
        --accent: #3b82f6;
        --accent-strong: #60a5fa;
        --danger: #fca5a5;
        --ring: rgba(96, 165, 250, 0.45);
        font-family: "DM Sans", "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 2rem;
        background:
          radial-gradient(circle at top, rgba(59, 130, 246, 0.2), transparent 40%),
          linear-gradient(180deg, #020617 0%, var(--background) 100%);
        color: var(--text);
      }

      main {
        width: min(100%, 28rem);
      }

      .panel {
        border: 1px solid var(--panel-border);
        border-radius: 1rem;
        background: var(--panel);
        box-shadow: 0 24px 60px rgba(2, 6, 23, 0.45);
        padding: 2rem;
        backdrop-filter: blur(20px);
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 0 1rem;
        color: var(--accent-strong);
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        font-size: clamp(2rem, 5vw, 2.5rem);
        line-height: 1.05;
      }

      p {
        margin: 1rem 0 0;
        color: var(--muted);
        line-height: 1.6;
      }

      form {
        display: grid;
        gap: 1rem;
        margin-top: 1.75rem;
      }

      label {
        display: grid;
        gap: 0.5rem;
        font-weight: 600;
      }

      input {
        width: 100%;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 0.85rem;
        padding: 0.95rem 1rem;
        background: rgba(15, 23, 42, 0.9);
        color: var(--text);
        font: inherit;
      }

      input:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 0.35rem var(--ring);
      }

      button {
        border: 0;
        border-radius: 999px;
        padding: 0.95rem 1.2rem;
        background: linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%);
        color: #eff6ff;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      button:hover {
        filter: brightness(1.05);
      }

      .error {
        margin: 0;
        color: var(--danger);
        font-size: 0.95rem;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="panel">
        <div class="eyebrow">BIM Docs</div>
        <h1>Sign in with the shared password</h1>
        <p>
          This documentation site is available to company members only. Enter the shared password to
          continue.
        </p>

        <form method="post">
          <input type="hidden" name="next" value="${escapedNext}">
          <label>
            Password
            <input name="password" type="password" autocomplete="current-password" required>
          </label>
          ${escapedError}
          <button type="submit">Open docs</button>
        </form>
      </section>
    </main>
  </body>
</html>`;
}

function htmlResponse(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

export const GET: APIRoute = async ({ cookies, redirect, url }) => {
  const redirectTo = getSafeRedirectTarget(url.searchParams.get("next"));
  const session = await verifySession(cookies.get(AUTH_COOKIE_NAME)?.value);

  if (session) {
    return redirect(redirectTo);
  }

  return htmlResponse(renderLoginPage({ next: redirectTo }));
};

export const POST: APIRoute = async ({ cookies, redirect, request, url }) => {
  const formData = await request.formData();
  const submittedPassword = formData.get("password");
  const redirectTo = getSafeRedirectTarget(String(formData.get("next") ?? url.searchParams.get("next")));

  if (!SITE_PASSWORD) {
    return htmlResponse(renderLoginPage({
      errorMessage: "Authentication is not configured for this deployment.",
      next: redirectTo,
    }), 500);
  }

  if (typeof submittedPassword !== "string" || submittedPassword !== SITE_PASSWORD) {
    return htmlResponse(renderLoginPage({ errorMessage: "Incorrect password.", next: redirectTo }), 401);
  }

  const sessionValue = await createSession();

  cookies.set(AUTH_COOKIE_NAME, sessionValue, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    expires: new Date(Date.now() + AUTH_COOKIE_MAX_AGE_SECONDS * 1000),
  });

  return redirect(redirectTo);
};
