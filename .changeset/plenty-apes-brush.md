---
"astro-aws-amplify": minor
---

Add runtimeEnv option that lists environment variables to propagate from the build to the Lambda runtime. Adapter writes them as a .env file next to entry.mjs, which server.ts already loads at cold start via process.loadEnvFile(). Missing variables emit a warning at build time and are skipped instead of writing empty KEY= lines.
