# astro-aws-amplify

Astro AWS Amplify is an Astro adapter for deploying server-side Astro sites on AWS Amplify Hosting.

[View Demo](https://main.dy0rr16jdndpq.amplifyapp.com/)

## Prerequisites

- an Astro site - `v6.x`
- Node.js `v22.12.0` or higher

## Installation

```sh
# Using NPM
npm install astro-aws-amplify
# Using Yarn
yarn add astro-aws-amplify
# Using PNPM
pnpm add astro-aws-amplify
```

In your Astro config, add the adapter:

```diff
// astro.config.mjs
import { defineConfig } from 'astro/config';
+ import awsAmplify from 'astro-aws-amplify';

export default defineConfig({
+ output: 'server',
+ adapter: awsAmplify()
})
```

## Configuration

### Astro

[Server and static modes](https://docs.astro.build/en/guides/server-side-rendering/#enable-on-demand-server-rendering) are supported. For fully static sites without SSR, remove the adapter and [follow these instructions](https://docs.astro.build/en/guides/deploy/aws/#aws-amplify).

### AWS Amplify

AWS Amplify Hosting uses Node.js v16 by default which isn't supported.

You can use the newer `Amazon Linux:2023` by adding an environment variable of:

```markdown
_CUSTOM_IMAGE=amplify:al2023
```

#### Build specifications

You can use the following build specifications as-is or customize it to your liking. Moving the `node_modules` folder is required for `npm` and `Yarn` deployments.

##### npm
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - env >> .env
        - npm run build
        - mv node_modules ./.amplify-hosting/compute/default
        - mv .env ./.amplify-hosting/compute/default/.env
  artifacts:
    baseDirectory: .amplify-hosting
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

##### pnpm
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm i -g pnpm
        - pnpm config set store-dir .pnpm-store
        - pnpm i
    build:
      commands:
        - env >> .env
        - pnpm run build
        - mv .env ./.amplify-hosting/compute/default/.env

  artifacts:
    baseDirectory: .amplify-hosting
    files:
      - '**/*'
  cache:
    paths:
      - .pnpm-store/**/*
```

##### Yarn
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - yarn install
    build:
      commands:
        - env >> .env
        - yarn run build
        - mv node_modules ./.amplify-hosting/compute/default
        - mv .env ./.amplify-hosting/compute/default/.env
  artifacts:
    baseDirectory: .amplify-hosting
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

## Redirects

Redirects defined in your `astro.config.mjs` are translated into AWS Amplify "Rewrites and redirects" rules at build time and written to `.amplify-hosting/customRules.json`:

```js
// astro.config.mjs
export default defineConfig({
  output: "server",
  adapter: awsAmplify(),
  redirects: {
    "/old-page": "/new-page",
    "/blog/[slug]": { status: 302, destination: "/posts/[slug]" },
    "/docs/[...path]": "/help/[...path]",
  },
});
```

After build, apply the generated file to your app via the Amplify Console, the AWS CLI (`aws amplify update-app --custom-rules`), or an `amplify.yml` postBuild step.

You can also pass platform-native rules (rewrites, API proxies, catch-all 404s) through a `customRules` option on the adapter — they're appended verbatim to the same file.

See the [package README](./packages/astro-aws-amplify/README.md#redirects) for the full reference — pattern syntax, status code mapping, base path and trailing-slash handling, rule ordering, custom rules, and the apply workflow in detail.

## Features

### Supported
- [server and static](https://docs.astro.build/en/guides/server-side-rendering/#enable-on-demand-server-rendering) mode
- image optimization with [`<Image>`](https://docs.astro.build/en/guides/images/#image--astroassets) and [`<Picture />`](https://docs.astro.build/en/guides/images/#picture-)
- [base paths](https://docs.astro.build/en/reference/configuration-reference/#base)
- [middleware](https://docs.astro.build/en/guides/middleware/)
- [redirects](#redirects) — auto-generated `customRules.json` from `astro.config.mjs`

### Unsupported or untested
- [Amplify Image](https://docs.aws.amazon.com/amplify/latest/userguide/image-optimization.html) optimization
- [build previews](https://docs.astro.build/en/reference/cli-reference/#astro-preview) (`npm run preview`)
- ???

## Limitations

### Static or prerendered pages

Static or prerendered pages (defined with `export const prerender = true`, or all pages when using `output: "static"`) need a rewrite rule, since Amplify routes those paths to the SSR compute by default.

The cleanest option is to declare these through the adapter's `customRules` option (see the [Redirects](#redirects) section), which keeps them in `astro.config.mjs` alongside the rest of your config:

```js
adapter: awsAmplify({
  customRules: [
    // Static page
    { source: "/about/", target: "/about/index.html", status: "200" },
    // Static dynamic route (e.g. /blog/[slug].astro)
    { source: "/blog/<slug>/", target: "/blog/<slug>/index.html", status: "200" },
  ],
}),
```

Adjust the trailing slash on `source` and `target` to match your [`trailingSlash`](https://docs.astro.build/en/reference/configuration-reference/#trailingslash) setting — drop it for `"never"`, keep it for `"always"` and the default `"ignore"`. For sites served under a `base`, prefix accordingly (`/base/about/` → `/base/about/index.html`). Like every other entry in `customRules`, you'll need to apply the generated file to your Amplify app for these rewrites to take effect — see the [Redirects](#redirects) section above for the three available methods.

The other option is to set up the same rules manually in the Amplify Console under **Hosting → Rewrites and redirects** — useful if you'd rather not put them in your Astro config or already manage Amplify rules outside of code.

For example, if you have a static `/about` page, create a rewrite of:

```
/about/ /about/index.html 200 (Rewrite)
```

If you don't use [trailing slashes](https://docs.astro.build/en/reference/configuration-reference/#trailingslash), you will need to also add:

```
/about /about/index.html 200 (Rewrite)
```

For static dynamic routes, like a route of `/blog/[slug].astro`, create a rewrite of:

```
/blog/<slug>/ /blog/<slug>/index.html 200 (Rewrite)
```

For sites served under a `base`:

```
/base/about/ /base/about/index.html 200 (Rewrite)
```

### 404 Pages
Custom 404 pages (like `404.astro`) need to be server-side rendered (not prerendered) to work. This is a [limitation with Amplify](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-deployment-specification.html#catchall-fallback-routing).

### Static files without extensions
Due to [limitations with Amplify routing](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-deployment-specification.html#catchall-fallback-routing), to serve `public` files without extensions, place them in a folder called `assets` (`/public/assets/`) and reference them with `/assets/filename`:

```sh title="/public/assets/"
somefile
```

Any other static files with extensions will work as usual.

## License

MIT

