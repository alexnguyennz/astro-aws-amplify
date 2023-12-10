# astro-aws-amplify

Experimental Astro adapter for hosting Astro v4.0 sites on AWS Amplify with SSR.

## Usage

### Installation

```sh
# Using NPM
npx astro add astro-aws-amplify
# Using Yarn
yarn astro add astro-aws-amplify
# Using PNPM
pnpm astro add astro-aws-amplify
```

### Manual Installation

```sh
# Using NPM
npm install astro-aws-amplify
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

Only `output: server` is supported. For fully static sites, remove `adapter` and `output` (or use `output: static`), and [follow these instructions](https://docs.astro.build/en/guides/deploy/aws/#aws-amplify).

### AWS Amplify 
AWS Amplify uses Node.js 16 by default for its build environment, which isn't supported by Astro v3.0+.

As a workaround, use a different Node.js image like the minimum supported `18.14.1`. This will increase the deployment time.

Build image (Edit build image settings > Build image dropdown):
```markdown
public.ecr.aws/docker/library/node:18.14.1
```

### Static or prerendered pages
All pages must be server-rendered by default - you can't use `export const prerender = true` on any pages. As a workaround for static pages however, you can set a manual Amplify rewrite for every static route.

For example, if you have a static `/about` page, create a rewrite of:

`/about/ /about/index.html 200 (Rewrite)`

If you don't force [trailing slashes](https://docs.astro.build/en/reference/configuration-reference/#trailingslash) or use page links with trailing slashes, you will need to also add:

`/about /about/index.html 200 (Rewrite)` 

For static dynamic routes, for example, a route of `/blog/[slug].astro`, create a rewrite of:

`/blog/<slug>/ /blog/<slug>/index.html 200 (Rewrite)`

### Unsupported / Untested
- image optimization e.g. with `<Image />`
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
  - appRoot: demo
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
          - '**/*'
      cache:
        paths:
          - .pnpm-store/**/*
```

Build image settings:
```markdown
public.ecr.aws/docker/library/node:18.14.1
```

## License 
MIT

## Acknowledgements

Uses code from the official [@astrojs/node](https://github.com/withastro/astro/tree/main/packages/integrations/node) adapter to establish a Node.js server required for AWS Amplify SSR environments.