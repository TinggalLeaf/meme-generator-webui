import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // The backend's generate endpoint REQUIRES a trailing slash
  // (POST /memes/{key}/). Keep Next from stripping it so our /api proxy route
  // forwards the exact path the API expects.
  trailingSlash: true,
  // Allow HMR/websocket dev resources when the page is opened via these hosts.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Proxying to the meme backend is handled by route handlers under
  // app/api/meme and app/api/memes (they follow redirects server-side, which
  // Next's `rewrites()` does not, so CORS is avoided). MEME_API_BASE overrides
  // the default target.
};

export default nextConfig;
