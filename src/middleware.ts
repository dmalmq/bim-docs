import { defineMiddleware } from "astro:middleware";
import { AUTH_COOKIE_NAME, DEFAULT_DOCS_PATH, verifySession } from "./lib/auth";

function isLoginPath(pathname: string) {
  return pathname === "/login" || pathname === "/login/";
}

function buildLoginRedirect(requestUrl: URL) {
  const loginUrl = new URL("/login", requestUrl);
  const nextPath =
    requestUrl.pathname === "/" ? DEFAULT_DOCS_PATH : `${requestUrl.pathname}${requestUrl.search}`;

  if (nextPath !== DEFAULT_DOCS_PATH) {
    loginUrl.searchParams.set("next", nextPath);
  }

  return loginUrl;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const isEdgeRequest = Boolean((context.locals as { vercel?: { edge?: unknown } }).vercel?.edge);

  if (import.meta.env.PROD && context.isPrerendered && !isEdgeRequest) {
    return next();
  }

  if (isLoginPath(context.url.pathname)) {
    return next();
  }

  const cookieValue = context.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySession(cookieValue);

  if (session) {
    if (context.url.pathname === "/") {
      return context.redirect(DEFAULT_DOCS_PATH);
    }

    return next();
  }

  return context.redirect(buildLoginRedirect(context.url));
});
