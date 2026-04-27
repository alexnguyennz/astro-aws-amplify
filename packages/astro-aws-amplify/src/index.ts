import type {
  AstroConfig,
  AstroIntegration,
  IntegrationResolvedRoute,
} from "astro";

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildCustomRules } from "./redirects.js";

export interface AwsAmplifyOptions {
  /**
   * Node.js runtime to declare in the SSR `deploy-manifest.json`.
   *
   * Defaults to `"nodejs22.x"`. Must be a runtime supported by Amplify Hosting.
   */
  runtime?: string;
}

export default function awsAmplify(
  options: AwsAmplifyOptions = {},
): AstroIntegration {
  let _config: AstroConfig;
  let _routes: IntegrationResolvedRoute[] = [];
  const { runtime = "nodejs22.x" } = options;

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
          entrypointResolution: "auto",
          supportedAstroFeatures: {
            serverOutput: "stable",
            hybridOutput: "stable",
            staticOutput: "unsupported",
            sharpImageService: "stable",
            envGetSecret: "stable",
          },
        });

        _config = config;
      },
      "astro:routes:resolved": ({ routes }) => {
        // Captured for `astro:build:done`, where we translate redirect routes
        // into Amplify's customRules format.
        _routes = routes;
      },
      "astro:build:done": async ({ logger }) => {
        const deployManifestConfig = {
          version: 1,
          routes: [
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
          computeResources: [
            {
              name: "default",
              entrypoint: "entry.mjs",
              runtime,
            },
          ],
          framework: {
            name: "astro",
            version: "6.0.0",
          },
        };

        const amplifyHostingDir = join(
          fileURLToPath(_config.root),
          ".amplify-hosting",
        );

        await writeFile(
          join(amplifyHostingDir, "deploy-manifest.json"),
          JSON.stringify(deployManifestConfig),
        );

        // Translate `redirects` from astro.config.mjs into Amplify's
        // customRules format. Amplify Hosting does not auto-discover redirect
        // rules from a build artifact the way Vercel/Netlify do, so this file
        // is meant to be applied to the app via the Amplify Console, the AWS
        // CLI, or an `amplify.yml` postBuild step. See the README "Redirects"
        // section for the full deployment workflow.
        //
        // Skipped when there are no redirects so builds don't emit an empty
        // config alongside the rest of the artifact tree.
        const customRules = buildCustomRules(
          _routes,
          _config.base,
          _config.trailingSlash,
          logger,
        );
        if (customRules.length > 0) {
          await writeFile(
            join(amplifyHostingDir, "customRules.json"),
            JSON.stringify(customRules, null, 2) + "\n",
          );
          logger.info(
            `Generated ${customRules.length} Amplify custom rule${
              customRules.length === 1 ? "" : "s"
            } → .amplify-hosting/customRules.json`,
          );
        }
      },
    },
  };
}
