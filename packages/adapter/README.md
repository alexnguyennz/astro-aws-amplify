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
+ output: 'server', // or output: 'hybrid'
+ adapter: awsAmplify()
})
```

## Configuration

### Astro

Server and hybrid modes are supported. For static sites, remove `adapter` and `output` (or use `output: static`) from your Astro config, and [follow these instructions](https://docs.astro.build/en/guides/deploy/aws/#aws-amplify). You can deploy the `dist` folder directly to Amplify with no extra setup required.

### AWS Amplify

AWS Amplify uses Node.js 16 with its default `Amazon Linux:2` build image, which isn't supported by Astro v3.0+. You can use the newer `Amazon Linux:2023` by adding an environment variable of:

Environment variable:

```markdown
_CUSTOM_IMAGE=amplify:al2023
```

#### Build specifications

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

### Static or prerendered pages

To use static pre-rendered pages (e.g. with `export const prerender = true` for `server`, or by default for `hybrid`), you will need to create an Amplify rewrite for every static route.

For example, if you have a static `/about` page, create a rewrite of:

`/about/ /about/index.html 200 (Rewrite)`

If you don't force [trailing slashes](https://docs.astro.build/en/reference/configuration-reference/#trailingslash) or use page links with trailing slashes, you will need to also add:

`/about /about/index.html 200 (Rewrite)`

For static dynamic routes, for example, a route of `/blog/[slug].astro`, create a rewrite of:

`/blog/<slug>/ /blog/<slug>/index.html 200 (Rewrite)`

For base path routes, create a rewrite of:

`/base/about/ /base/about/index.html 200 (Rewrite)`

## Features

### Supported
- server and hybrid mode
- image optimization with `<Image>` and `<Picture />`
- base paths
- middleware

### Unsupported / Untested
- Amplify Image optimization
- ???

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
demos/blog
```

AWS Amplify build specification:

```yaml
version: 1
applications:
  # if you want to deploy another demo or change the configuration, you will need to change `amplify.yml` - changing the build spec won't override this file
  - appRoot: demos/blog
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
