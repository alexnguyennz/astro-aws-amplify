import type { SSRManifest } from "astro";
import { NodeApp, applyPolyfills } from "astro/app/node";

import startServer from "@astrojs/node/standalone.js";
import type { Options } from "@astrojs/node/types.js";

applyPolyfills();
export function createExports(manifest: SSRManifest, options: Options) {
  const app = new NodeApp(manifest);
  return {
    options: options,
    startServer: () => startServer(app, options),
  };
}

export function start(manifest: SSRManifest, options: Options) {
  const app = new NodeApp(manifest);
  startServer(app, options);
}
