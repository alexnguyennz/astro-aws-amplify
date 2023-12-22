import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  site: "https://astro-aws-amplify.alexnguyen.co.nz",
  integrations: [
    starlight({
      title: "Astro AWS Amplify",
      social: {
        github: "https://github.com/alexnguyennz/astro-aws-amplify",
        "x.com": "https://twitter.com/anguyendev",
      },
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Setup", link: "/setup/" },
            { label: "Features", link: "/features/" },
            { label: "Limitations", link: "/limitations/" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "Monorepo Setup", link: "/reference/monorepo-setup/" },
          ],
        },
      ],
    }),
  ],
});
