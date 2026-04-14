import { AsyncLocalStorage } from "node:async_hooks";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createApp } from "astro/app/entrypoint";
import { createRequest, writeResponse } from "astro/app/node";

if (existsSync(".env")) process.loadEnvFile();

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".ico": "image/x-icon",
};

const app = createApp();
const logger = app.getAdapterLogger();
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";

const clientRoot = resolveClientRoot();
const assetsPrefix = `/${app.manifest.assetsDir}/`;

function resolveClientRoot(): string | null {
  const serverDir = fileURLToPath(new URL(".", import.meta.url));
  const clientDir = resolve(serverDir, "../../static");
  return existsSync(clientDir) ? clientDir : null;
}

function tryServeStatic(
  url: string,
  res: import("node:http").ServerResponse,
): boolean {
  if (!clientRoot) return false;

  const pathname = new URL(url, `http://localhost:${port}`).pathname;
  const stripped = app.removeBase(pathname);
  const filePath = join(clientRoot, stripped);
  const resolved = resolve(filePath);

  if (!resolved.startsWith(clientRoot)) return false;

  try {
    const fileStat = statSync(resolved);
    if (!fileStat.isFile()) return false;
  } catch {
    return false;
  }

  const ext = extname(resolved);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const headers: Record<string, string> = { "Content-Type": contentType };

  if (stripped.startsWith(assetsPrefix)) {
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
  }

  res.writeHead(200, headers);
  createReadStream(resolved).pipe(res);
  return true;
}

const als = new AsyncLocalStorage<string>();

process.on("unhandledRejection", (reason) => {
  const requestUrl = als.getStore();
  logger.error(`Unhandled rejection while rendering ${requestUrl}`);
  console.error(reason);
});

const server = createServer(async (req, res) => {
  if (req.url && tryServeStatic(req.url, res)) return;

  let request: Request;
  try {
    request = createRequest(req, {
      allowedDomains: app.getAllowedDomains?.() ?? [],
    });
  } catch (err) {
    logger.error(`Could not create request for ${req.url}`);
    console.error(err);
    res.statusCode = 500;
    res.end("Internal Server Error");
    return;
  }

  const response = await als.run(request.url, () =>
    app.render(request, { addCookieHeader: true }),
  );
  await writeResponse(response, res);
});

server.listen(port, host, () => {
  logger.info(`Server listening on http://${host}:${port}`);
});
