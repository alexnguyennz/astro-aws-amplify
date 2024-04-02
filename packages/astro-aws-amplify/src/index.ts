import type { AstroConfig, AstroIntegration } from "astro";

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export default function awsAmplify(): AstroIntegration {
  let _config: AstroConfig;

  return {
    name: "astro-aws-amplify",
    hooks: {
      "astro:config:setup": ({ config, updateConfig }) => {
        updateConfig({
          build: {
            client: new URL(
              `./.amplify-hosting/static${config.base}`,
              config.root,
            ),
            server: new URL("./.amplify-hosting/compute/default/", config.root),
          },
        });
      },
      "astro:config:done": ({ config, setAdapter }) => {
        setAdapter({
          name: "astro-aws-amplify",
          serverEntrypoint: "astro-aws-amplify/server",
          supportedAstroFeatures: {
            serverOutput: "stable",
            hybridOutput: "stable",
            staticOutput: "unsupported",
            assets: {
              supportKind: "stable",
              isSharpCompatible: true,
              isSquooshCompatible: true,
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
      "astro:build:done": async () => {
        const deployManifestConfig = {
          version: 1,
          routes: [
            {
              path: "/images/*",
              target: {
                kind: "ImageOptimization",
                cacheControl: "public, max-age=31536000, immutable",
              },
            },
            {
              path: `${_config.base}assets/*`,
              target: {
                kind: "Static",
              },
            },
            {
              path: `${_config.base}*.*`,
              target: {
                kind: "Static",
              },
              fallback: {
                kind: "Compute",
                src: "default",
              },
            },
            {
              path: "/*",
              target: {
                kind: "Compute",
                src: "default",
              },
            },
          ],
          imageSettings: {
            sizes: [100, 200],
            domains: [],
            formats: ["image/webp"],
            minumumCacheTTL: 60,
            dangerouslyAllowSVG: false,
          },
          computeResources: [
            {
              name: "default",
              entrypoint: "entry.mjs",
              runtime: "nodejs18.x",
            },
          ],
          framework: {
            name: "astro",
            version: "4.0.0",
          },
        };

        const functionsConfigPath = join(
          fileURLToPath(_config.root),
          "/.amplify-hosting/deploy-manifest.json",
        );
        await writeFile(
          functionsConfigPath,
          JSON.stringify(deployManifestConfig),
        );
      },
    },
  };
}
