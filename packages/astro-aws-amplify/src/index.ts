import type {
  AstroConfig,
  AstroIntegration,
  IntegrationResolvedRoute,
} from "astro";

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import type { AmplifyCustomRule } from "./redirects.js";
import { buildCustomRules } from "./redirects.js";

export type {
  AmplifyCustomRule,
  AmplifyRedirectStatus,
} from "./redirects.js";

export interface AwsAmplifyOptions {
  /**
   * Node.js runtime to declare in the SSR `deploy-manifest.json`.
   *
   * Defaults to `"nodejs22.x"`. Must be a runtime supported by Amplify Hosting.
   */
  runtime?: string;

  /**
   * Extra Amplify custom rules appended verbatim after the rules generated
   * from `astro.config.mjs`'s `redirects` field. Use these for SPA-fallback
   * rewrites, API proxies, catch-all 404s, or anything else Astro's
   * `redirects` field doesn't model.
   *
   * Rules are emitted in declaration order, after the (specificity-sorted)
   * generated redirects. That ordering means a generic catch-all rewrite
   * here won't shadow a specific redirect from `astro.config.mjs`.
   */
  customRules?: AmplifyCustomRule[];
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
        // customRules format, then append any user-supplied rules from the
        // `customRules` adapter option verbatim. Amplify Hosting does not
        // auto-discover redirect rules from a build artifact the way
        // Vercel/Netlify do, so this file is meant to be applied to the app
        // via the Amplify Console, the AWS CLI, or an `amplify.yml`
        // postBuild step. See the README "Redirects" section for the full
        // deployment workflow.
        //
        // Skipped when both lists are empty so builds don't emit an empty
        // config alongside the rest of the artifact tree.
        const generatedRules = buildCustomRules(
          _routes,
          _config.base,
          _config.trailingSlash,
          logger,
        );
        const extraRules = options.customRules ?? [];
        const allRules = [...generatedRules, ...extraRules];

        if (allRules.length > 0) {
          await writeFile(
            join(amplifyHostingDir, "customRules.json"),
            JSON.stringify(allRules, null, 2) + "\n",
          );

          const parts: string[] = [];
          if (generatedRules.length > 0) {
            parts.push(`${generatedRules.length} from redirects`);
          }
          if (extraRules.length > 0) {
            parts.push(`${extraRules.length} from customRules`);
          }
          logger.info(
            `Wrote ${allRules.length} Amplify rule${
              allRules.length === 1 ? "" : "s"
            } (${parts.join(", ")}) → .amplify-hosting/customRules.json`,
          );
        }
      },
    },
  };
}
