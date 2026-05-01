import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import awsAmplify from "astro-aws-amplify";

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  trailingSlash: "always",
  base: "/base",
  integrations: [mdx(), sitemap()],
  output: "server",
  adapter: awsAmplify(),
  // Demonstrates the redirect → Amplify customRules pipeline together with
  // the `base` config option. Both `source` and `target` are auto-prefixed
  // with `/base/` in the generated `.amplify-hosting/customRules.json`.
  redirects: {
    "/old-page": "/new-page",
    "/blog/[slug]": { status: 302, destination: "/posts/[slug]" },
  },
});
