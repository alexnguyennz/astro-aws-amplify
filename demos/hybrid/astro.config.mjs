import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import awsAmplify from "astro-aws-amplify";

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  trailingSlash: "ignore",
  integrations: [mdx(), sitemap()],
  output: "hybrid",
  adapter: awsAmplify(),
});
