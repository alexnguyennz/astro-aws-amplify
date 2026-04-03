Astro 6 removed the `applyPolyfills` export from `astro/app/node` and deprecated the `NodeApp` / `createExports()` / `start()` adapter API entirely. This PR rewrites the server entrypoint using Astro 6's new `createApp()` API and bumps the package to `1.0.0` with Astro 6 as the only supported version.

## Why a new major version?

`applyPolyfills` polyfilled `crypto` and `import.meta.resolve` for Node 18/20. Astro 6 requires Node 22+, where both APIs are natively available, so the export was removed entirely. Astro 6 also deprecated the old adapter entrypoint pattern (`NodeApp`, `createExports()`, `start()`) in favor of `createApp()` with `entrypointResolution: "auto"`. Rather than conditionally importing polyfills and shimming the old API to maintain backward compatibility with Astro 4/5, it felt cleaner to target Astro 6 only and let users on older versions stick with `0.2.x`.

## Changes

### Adapter

- `server.ts` — Rewritten to use `createApp()` from `astro/app/entrypoint` and `createRequest()` / `writeResponse()` from `astro/app/node`. Removed the deprecated `NodeApp`, `createExports()`, and `start()` pattern. The server is now a plain module that creates an HTTP server directly. Includes a lightweight static file handler using `node:fs` as a safety net for CDN fallback requests.
- `index.ts` — Added `entrypointResolution: "auto"` to `setAdapter()`, removed `args` (no longer needed). Default runtime changed from `nodejs20.x` to `nodejs22.x`. Added `sharpImageService: "stable"` and `envGetSecret: "stable"` to supported features. Updated the hardcoded framework version in the deploy manifest from `4.0.0` to `6.0.0`.
- `package.json` — Version bumped to `1.0.0`. Peer dependency changed from `^4.0.0 || ^5.0.0` to `^6.0.0`. Dropped the `astrojs-node-aws-amplify` dependency (a fork of `@astrojs/node` built for the old API) — the server logic is now self-contained.

### Demos

All three demos were updated for Astro 6:

- **Dependencies** — `astro` bumped to `^6.0.0`.
- **Content collections** — Migrated from the legacy `src/content/config.ts` to the Content Layer API.
- **Hybrid demo** — Changed `output: "hybrid"` to `output: "static"` (Astro 6 replacement).

### Demo renames

The demo names were updated to match Astro 6 terminology:

- `blog` → `server` — uses `output: "server"` (full SSR)
- `hybrid` → `static` — uses `output: "static"` with per-page `prerender: false` (selective SSR)
- `base-path` — unchanged
