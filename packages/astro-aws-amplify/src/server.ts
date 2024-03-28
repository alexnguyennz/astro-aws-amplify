import 'dotenv/config'
import type { SSRManifest } from 'astro'
import { NodeApp, applyPolyfills } from 'astro/app/node'
import startServer from 'astrojs-node-aws-amplify/standalone.js'
import type { Options } from 'astrojs-node-aws-amplify/types.js'

applyPolyfills()

export function createExports(manifest: SSRManifest, options: Options) {
  const app = new NodeApp(manifest)
  return {
    options: options,
    startServer: () => startServer(app, options),
  }
}

export function start(manifest: SSRManifest, options: Options) {
  const app = new NodeApp(manifest)
  startServer(app, options)
}
