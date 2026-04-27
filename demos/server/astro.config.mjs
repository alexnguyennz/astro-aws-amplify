import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import awsAmplify from "astro-aws-amplify";

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  trailingSlash: "always",
  image: {
    domains: ["picsum.photos"],
  },
  integrations: [mdx(), sitemap()],
  output: "server",
  adapter: awsAmplify(),
  // Demonstrates the redirect → Amplify customRules pipeline.
  // After build, see `.amplify-hosting/customRules.json`.
  redirects: {
    // Static redirect (default 301).
    "/old-page": "/new-page",
    // Dynamic param redirect with explicit status.
    "/blog/[slug]": {
      status: 302,
      destination: "/posts/[slug]",
    },
    // Catch-all spread redirect.
    "/docs/[...path]": "/help/[...path]",
  },
});
