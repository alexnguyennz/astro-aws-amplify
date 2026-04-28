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

## Redirects

Redirects defined in `astro.config.mjs` are translated into AWS Amplify "Rewrites and redirects" rules at build time and written to `.amplify-hosting/customRules.json`. The shape of that file matches the payload accepted by `aws amplify update-app --custom-rules`, so you can apply it to your Amplify app verbatim.

### Declare redirects in your Astro config

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import awsAmplify from "astro-aws-amplify";

export default defineConfig({
  output: "server",
  adapter: awsAmplify(),
  redirects: {
    // Static redirect — defaults to 301 (permanent).
    "/old-page": "/new-page",
    // Dynamic param with explicit status. Status options: 301, 302, 303, 307, 308.
    "/blog/[slug]": { status: 302, destination: "/posts/[slug]" },
    // Spread / catch-all params are supported.
    "/docs/[...path]": "/help/[...path]",
  },
});
```

After `astro build` runs, `.amplify-hosting/customRules.json` will contain:

```json
[
  { "source": "/old-page", "target": "/new-page", "status": "301" },
  { "source": "/blog/<slug>", "target": "/posts/<slug>", "status": "302" },
  { "source": "/docs/<*>", "target": "/help/<*>", "status": "301" }
]
```

If your config has no `redirects` entries, the file is not written.

### Apply the rules to your Amplify app

Unlike Vercel and Netlify, AWS Amplify Hosting does not auto-discover redirect rules from a build artifact. You need to push the generated rules to the app once — pick whichever of these fits your workflow.

#### Option A — Amplify Console (one-time, manual)

1. Open your app in the AWS Amplify Console.
2. Go to **Hosting → Rewrites and redirects**.
3. Click **Manage rewrites and redirects**, paste the contents of `.amplify-hosting/customRules.json`, and save.

This is the simplest path if your redirects rarely change.

#### Option B — `aws amplify update-app` (one-shot or scripted)

Run locally or in CI after a build:

```sh
aws amplify update-app \
  --app-id "$AWS_APP_ID" \
  --custom-rules "$(cat .amplify-hosting/customRules.json)"
```

Requires `awscli` configured with credentials that have `amplify:UpdateApp` permission.

#### Option C — `amplify.yml` postBuild step (continuous deployment)

Add a `postBuild` step so every Amplify build pushes the latest rules:

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
    postBuild:
      commands:
        - |
          if [ -f .amplify-hosting/customRules.json ]; then
            aws amplify update-app \
              --app-id "$AWS_APP_ID" \
              --custom-rules "$(cat .amplify-hosting/customRules.json)"
          fi
  artifacts:
    baseDirectory: .amplify-hosting
    files:
      - "**/*"
```

Set `AWS_APP_ID` as an Amplify environment variable, and attach an IAM policy allowing `amplify:UpdateApp` on the app's ARN to your Amplify service role.

> **Heads up:** `update-app` with `--custom-rules` *replaces* the rule list. If you also manage rules in the Console, define them all in `astro.config.mjs` instead so the build is the single source of truth.

### Status code mapping

Amplify only supports `301` and `302` as redirect statuses, so Astro's other codes are converted as follows:

| Astro | Amplify |
| ----- | ------- |
| `301` | `301`   |
| `302` | `302`   |
| `303` | `302`   |
| `307` | `302`   |
| `308` | `301`   |

`301` and `302` map exactly. `303`, `307`, and `308` emit a warning log at build time so the change is visible. Unknown status codes are also skipped with a warning.

### Dynamic params and spread routes

Amplify supports two distinct placeholder constructs and the adapter maps each Astro segment to the right one:

- `[param]` → `<param>` — Amplify's named placeholder. The same name in `target` substitutes the captured segment, so `/old/[a]/[b]` → `/new/[a]/[b]` becomes `/old/<a>/<b>` → `/new/<a>/<b>`. Multiple named placeholders per rule are allowed.
- `[...spread]` → `<*>` — Amplify's greedy wildcard. It matches one or more path segments and is restricted to a single occurrence at the end of the source. Astro only allows `[...spread]` as the trailing segment of a route, so this restriction is satisfied automatically.

Mixed patterns like `/site/[lang]/[...rest]` translate to `/site/<lang>/<*>`, combining a named placeholder with the trailing wildcard.

### Base paths

If your site is served under a `base` (`base: "/docs"` in `astro.config.mjs`), the adapter automatically prefixes both `source` and `target` with the base, so a redirect declared as `/old` → `/new` becomes `/docs/old` → `/docs/new` in `customRules.json`. Write your redirect keys/values relative to the site root the same way you do everywhere else in Astro — the prefixing is handled for you.

### External destinations

Absolute URLs (`https://...`, `http://...`, or protocol-relative `//host/...`) are preserved verbatim in `target` and never base-prefixed, so `"/external": "https://example.com/page"` lands in `customRules.json` exactly as written.

### Trailing slashes

The adapter reads `config.trailingSlash` and brings the generated rules into line with the canonical URL shape, so the edge handles the redirect without falling through to SSR:

- `"always"` — literal sources and targets get a `/` appended (`/old-page/`, `/posts/[slug]/`).
- `"never"` — any trailing slash is stripped.
- `"ignore"` (default) — sources and targets are emitted as written.

Wildcard endings (`/blog/<*>`) are left alone in every mode because Amplify's `<*>` is greedy and matches both `/blog/foo` and `/blog/foo/` from a single rule. Paths that look like static files (`/sitemap.xml`) and absolute URL targets (`https://...`) are also left untouched. Named placeholders (`/blog/<slug>`) are treated like literal segments and do receive the trailing-slash treatment.

### Rule ordering

Amplify evaluates `customRules` in declaration order — the first match wins. The adapter sorts the generated rules so more specific patterns come before generic ones (rules with fewer wildcards first; longer literal prefixes break ties). That keeps a generic catch-all like `/[...all]` from accidentally swallowing a specific `/blog/[slug]` redirect declared on the same site.

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

Static or prerendered pages (that are defined with `export const prerender = true`, or all pages by default when using `output: "static"`) will need a rewrite rule.

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

