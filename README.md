# astro-aws-amplify

Astro AWS Amplify is an Astro adapter for deploying server-side Astro sites on AWS Amplify Hosting.

[View Demo](https://main.dy0rr16jdndpq.amplifyapp.com/)

## Prerequisites

- an Astro site - `v4.x` or higher (may also work on `v3.x` sites)

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
+ output: 'server', // output: 'hybrid'
+ adapter: awsAmplify()
})
```

## Configuration

### Astro

[Server and hybrid modes](https://docs.astro.build/en/guides/server-side-rendering/#enable-on-demand-server-rendering) are supported. For static sites, remove the adapter and [follow these instructions](https://docs.astro.build/en/guides/deploy/aws/#aws-amplify).

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
        - npm run build
        - mv node_modules ./.amplify-hosting/compute/default
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
        - pnpm run build
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
        - yarn run build
        - mv node_modules ./.amplify-hosting/compute/default
  artifacts:
    baseDirectory: .amplify-hosting
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

## Features

### Supported
- [server and hybrid](https://docs.astro.build/en/guides/server-side-rendering/#enable-on-demand-server-rendering) mode
- image optimization with [`<Image>`](https://docs.astro.build/en/guides/images/#image--astroassets) and [`<Picture />`](https://docs.astro.build/en/guides/images/#picture-)
- [base paths](https://docs.astro.build/en/reference/configuration-reference/#base)
- [middleware](https://docs.astro.build/en/guides/middleware/)

### Unsupported or untested
- [Amplify Image](https://docs.aws.amazon.com/amplify/latest/userguide/image-optimization.html) optimization
- [build previews](https://docs.astro.build/en/reference/cli-reference/#astro-preview) (`npm run preview`)
- ???

## Limitations

### Static or prerendered pages

Static or prerendered pages (that are defined with `export const prerender = true` or default for hybrid) will need a rewrite rule.

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


#### Base path rewrites

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

## Acknowledgements

Uses code from the [@astrojs/node](https://github.com/withastro/astro/tree/main/packages/integrations/node) adapter to establish a Node.js server required for AWS Amplify SSR environments.
