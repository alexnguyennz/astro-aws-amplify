---
title: Monorepo Setup
description: Monorepo Setup
---

## Local Setup

1. Clone the project:

    ```shell
    git clone https://github.com/alexnguyennz/astro-aws-amplify
    ```

2. Install the project:

    ```sh
    pnpm install
    ```
   
3. Build any of the demos after making changes to `packages/astro-aws-amplify`:

    ```sh
    turbo build --filter blog
    # turbo build --filter base-path, etc.
    ```
   
4. To run a demo locally:

   ```sh
    turbo dev --filter blog
    # turbo dev --filter base-path, etc.
    ```

### Amplify Hosting Deployment

1. Connect the monorepo repository.

2. Tick "Connecting a monorepo? Pick a folder." and enter the path to the demo you want to deploy:

   ```shell
   demos/blog
   ```
   
3. If you want to deploy another demo, change it in `amplify.yml` - you can't override this file's settings in the Amplify Hosting panel.

4. Set an environment variable to use Node.js 18:

   ```markdown title="Amplify Environment Variables"
   _CUSTOM_IMAGE=amplify:al2023
   ```
   
Build specification example:

```yaml
version: 1
applications:
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

## Further reading

- [Amplify Hosting monorepo build settings](https://docs.aws.amazon.com/amplify/latest/userguide/monorepo-configuration.html)