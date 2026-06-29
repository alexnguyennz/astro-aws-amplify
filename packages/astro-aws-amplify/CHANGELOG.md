# astro-aws-amplify

## 0.6.0

### Minor Changes

- [`c6b3511`](https://github.com/alexnguyennz/astro-aws-amplify/commit/c6b35117fbf60cc0e1ea0bc8d4841be5d7469052) Thanks [@KabraX](https://github.com/KabraX)! - Add runtimeEnv option that lists environment variables to propagate from the build to the Lambda runtime. Adapter writes them as a .env file next to entry.mjs, which server.ts already loads at cold start via process.loadEnvFile(). Missing variables emit a warning at build time and are skipped instead of writing empty KEY= lines.

## 0.5.0

### Minor Changes

- Add support for Astro 7 — widen the `astro` peer dependency to `^6.0.0 || ^7.0.0`. Astro 6 and 7 share the same adapter API, and Astro 7's move to Vite 8 (Rolldown) is transparent to the adapter, so it works unchanged on both majors.
- Report the actual installed Astro version in the generated `deploy-manifest.json` `framework.version` instead of the previously hardcoded `"6.0.0"`.
- Declare `adapterFeatures.buildOutput: "server"` explicitly, since Amplify always deploys a Node compute (previously relied on this being Astro's implicit default).

## 0.4.1

### Patch Changes

- Fix compatibility with Astro 6.3.0+ where `getAdapterLogger()` was renamed to `adapterLogger` getter property

## 0.4.0

### Minor Changes

- Add support for redirects defined in `astro.config.mjs` — generates `.amplify-hosting/customRules.json` from your `redirects` config
- Add a `customRules` adapter option for passing Amplify rules (rewrites, API proxies, 404 fallbacks) alongside the generated redirects
- Add an `astro-aws-amplify/redirects` subpath export for using the rule-building helpers outside `astro.config.mjs` (e.g., when sourcing redirects from a CMS)

## 0.3.0

### Major Changes

- Drop support for Astro v4 and v5
- Add support for Astro v6
- Bump minimum required Node version to 22.12.0
- Bump default Amplify compute runtime from `nodejs20.x` to `nodejs22.x`
- Add stable support for the Sharp image service
- Add stable support for `astro:env` `getSecret()`

## 0.2.4

### Patch Changes

- add runtime option to awsAmplify function

## 0.2.3

### Patch Changes

- Fix TypeScript error with Astro 5.x compatibility

## 0.2.2

### Patch Changes

- [`61db975`](https://github.com/alexnguyennz/astro-aws-amplify/commit/61db9752af11e5aa5663a9287486ad333095ab27) Thanks [@alexnguyennz](https://github.com/alexnguyennz)! - Update compute runtime node version in deploy manifest

## 0.2.1

### Patch Changes

- Add astro v5 as peer dependency

## 0.2.0

### Minor Changes

- Add Astro as peer dependency

## 0.1.0

### Minor Changes

- [#21](https://github.com/alexnguyennz/astro-aws-amplify/pull/21) [`a5718d4`](https://github.com/alexnguyennz/astro-aws-amplify/commit/a5718d470043db7abcd07e5c601c348a9a87efb5) Thanks [@rishi-raj-jain](https://github.com/rishi-raj-jain)! - load environment variables automatically

## 0.0.9

### Patch Changes

- Added routing for extensionless static files

## 0.0.8

### Patch Changes

- Update @astrojs/node (fork) dependency

## 0.0.7

### Patch Changes

- [#10](https://github.com/alexnguyennz/astro-aws-amplify/pull/10) [`f719462`](https://github.com/alexnguyennz/astro-aws-amplify/commit/f71946256dd1b62896bd49458eb9860f2da9ac94) Thanks [@alexnguyennz](https://github.com/alexnguyennz)! - Added deployment build specifications

- [#11](https://github.com/alexnguyennz/astro-aws-amplify/pull/11) [`22731af`](https://github.com/alexnguyennz/astro-aws-amplify/commit/22731af0794e054be7e55680f1bfe8d1c7dde7e0) Thanks [@alexnguyennz](https://github.com/alexnguyennz)! - Update features description (middleware)

---

## 0.0.6

### Patch Changes

- Added hybrid output support

## 0.0.5

### Patch Changes

- Project setup + base paths
