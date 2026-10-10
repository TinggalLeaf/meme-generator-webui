import { NextRequest, NextResponse } from "next/server";

const MEME_API_BASE = process.env.MEME_API_BASE || "http://192.168.10.103:2233";

// Hop-by-hop / host-specific headers that must not be forwarded.
const SKIP_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "accept-encoding",
]);

const SKIP_RESPONSE_HEADERS = new Set([
  "transfer-encoding",
  "connection",
  "content-length",
  "content-encoding",
]);

/**
 * Proxy a request to the meme backend, following any redirects *server-side*
 * so the browser only ever talks to this same-origin Next app. This avoids the
 * CORS breakage that happens when Next's `rewrites()` passes an upstream 307
 * (with an absolute backend Location) through to the browser.
 */
export async function proxyToMeme(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;
  // pathname starts with /api; strip it to recover the backend path.
  const backendPath = pathname.replace(/^\/api/, "") || "/";
  const target = `${MEME_API_BASE}${backendPath}${search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!SKIP_REQUEST_HEADERS.has(key.toLowerCase())) headers.set(key, value);
  });

  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers,
    // Follow the backend's 307 server-side so the final response is same-origin.
    redirect: "follow",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
    init.duplex = "half";
  }

  const upstream = await fetch(target, init);

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!SKIP_RESPONSE_HEADERS.has(key.toLowerCase()))
      responseHeaders.set(key, value);
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
