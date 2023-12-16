# astro-aws-amplify

Experimental Astro adapter for hosting Astro v4.0 sites on AWS Amplify with SSR.

[View Demo](https://main.dy0rr16jdndpq.amplifyapp.com/)

## Usage

### Installation

```sh
# Using NPM
npm install astro-aws-amplify
# Using Yarn
yarn add astro-aws-amplify
# Using PNPM
pnpm add astro-aws-amplify
```

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

Only `output: server` is currently supported. For fully static sites, remove `adapter` and `output` (or use `output: static`), and [follow these instructions](https://docs.astro.build/en/guides/deploy/aws/#aws-amplify).

### AWS Amplify

AWS Amplify uses Node.js 16 with its default `Amazon Linux:2` build image, which isn't supported by Astro v3.0+. You can use the newer `Amazon Linux:2023` by adding an environment variable of:

Environment variable:

```markdown
\_CUSTOM_IMAGE=amplify:al2023
```

### Static or prerendered pages

All pages must be server-rendered by default - you can't use `export const prerender = true` on any pages. As a workaround for static pages however, you can set a manual Amplify rewrite for every static route.

For example, if you have a static `/about` page, create a rewrite of:

`/about/ /about/index.html 200 (Rewrite)`

If you don't force [trailing slashes](https://docs.astro.build/en/reference/configuration-reference/#trailingslash) or use page links with trailing slashes, you will need to also add:

`/about /about/index.html 200 (Rewrite)`

For static dynamic routes, for example, a route of `/blog/[slug].astro`, create a rewrite of:

`/blog/<slug>/ /blog/<slug>/index.html 200 (Rewrite)`

## Features

### Supported

- image optimization with `<Image>` and `<Picture />` (tentative)

### Unsupported / Untested

- hybrid mode
- middleware
- base path (and other Astro configuration changes)

## Monorepo Project Setup

### Installation

```sh
pnpm install
```

### Run or build demo locally

```shell
pnpm dev
pnpm build
```

### AWS Amplify Deployment

Tick "Connecting a monorepo? Pick a folder." and enter:

```shell
demo
```

AWS Amplify build specification (preset in `amplify.yml`):

```yaml
version: 1
applications:
  - appRoot: demos/blog # change accordingly
    frontend:
      phases:
        preBuild:
          commands:
            - npm i -g pnpm
            - pnpm config set store-dir .pnpm-store
            - pnpm i
        build:
          commands:
            - pnpm run build
      artifacts:
        baseDirectory: .amplify-hosting
        files:
          - "**/*"
      cache:
        paths:
          - .pnpm-store/**/*
```

Environment variable (to use newer image):

```markdown
_CUSTOM_IMAGE=amplify:al2023
```

## License

MIT

## Acknowledgements

Uses code from the official [@astrojs/node](https://github.com/withastro/astro/tree/main/packages/integrations/node) adapter to establish a Node.js server required for AWS Amplify SSR environments.
