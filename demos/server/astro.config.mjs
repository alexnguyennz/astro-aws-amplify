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
  // Demonstrates the redirect → Amplify customRules pipeline. Both the
  // `redirects` field below and the `customRules` adapter option flow into
  // `.amplify-hosting/customRules.json` after `astro build`.
  adapter: awsAmplify({
    customRules: [
      // Rewrite for a specific prerendered page (status 200 = serve the
      // target file without changing the URL in the browser).
      { source: "/about/", target: "/about/index.html", status: "200" },
      // Same pattern with a placeholder, covering any single-segment
      // prerendered page (e.g. /contact/, /pricing/).
      { source: "/<a>/", target: "/<a>/index.html", status: "200" },
    ],
  }),
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
