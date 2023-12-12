import type { AstroConfig, AstroIntegration} from 'astro';

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export default function amplify(): AstroIntegration {
  let _config: AstroConfig;

  return {
    name: "astro-amplify",
    hooks: {
      'astro:config:setup': ({ config, updateConfig }) => {
        updateConfig({
          build: {
            client: new URL('./.amplify-hosting/static/', config.root),
            server: new URL('./.amplify-hosting/compute/default/', config.root),
          },
        });
      },
      'astro:config:done': ({ config, setAdapter }) => {
        setAdapter({
          name: 'astro-aws-amplify',
          serverEntrypoint: 'astro-aws-amplify/server',
          supportedAstroFeatures: {
            hybridOutput: 'unsupported',
            staticOutput: 'unsupported',
            serverOutput: 'stable',
            assets: {
              supportKind: 'stable',
              isSharpCompatible: true,
              isSquooshCompatible: false,
            },
          },
          args: {
            client: config.build.client?.toString(),
            server: config.build.server?.toString(),
            host: config.server.host,
            port: 3000,
            assets: config.build.assets,
          },
        });

        _config = config;
      },
      'astro:build:done': async () => {
        const deployManifestConfig = {
          "version": 1,
          "routes": [
            {
              "path": "/*",
              "target": {
                "kind": "Compute",
                "src": "default"
              },
              "fallback": {
                "kind": "Static"
              }
            },
            {
              "path": "/*.*",
              "target": {
                "kind": "Static"
              },
            },
          ],
          "computeResources": [
            {
              "name": "default",
              "entrypoint": "entry.mjs",
              "runtime": "nodejs18.x"
            }
          ],
          "framework": {
            "name": "astro",
            "version": "4.0.3"
          }
        }

        const functionsConfigPath = join(fileURLToPath(_config.root), '/.amplify-hosting/deploy-manifest.json');
        await writeFile(functionsConfigPath, JSON.stringify(deployManifestConfig));
      },
    },
  };
}

