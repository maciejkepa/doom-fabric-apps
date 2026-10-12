import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const publicDirectory = resolve(fileURLToPath(new URL(process.env.SERVE_DIST === "1" ? "./dist/" : "./public/", import.meta.url)));
const port = Number.parseInt(
  process.env.PORT ?? "8000",
  10,
);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".data", "application/octet-stream"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".wasm", "application/wasm"],
]);

export const app = createServer((request, response) => {
  if (request.url === "/health" || request.url?.startsWith("/health?")) {
    response.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    });
    response.end('{"status":"ok"}\n');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://app").pathname);
  } catch {
    response.writeHead(400).end("Bad request\n");
    return;
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = resolve(publicDirectory, relativePath);
  if (!filePath.startsWith(publicDirectory + sep)) {
    response.writeHead(403).end("Forbidden\n");
    return;
  }

  let file;
  try {
    file = statSync(filePath);
    if (!file.isFile()) throw new Error("Not a file");
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found\n");
    return;
  }

  const immutableAsset = pathname.startsWith("/vendor/");
  response.writeHead(200, {
    "content-type": contentTypes.get(extname(filePath)) ?? "application/octet-stream",
    "content-length": file.size,
    "cache-control": immutableAsset
      ? "public, max-age=31536000, immutable"
      : "no-cache",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
});

if (process.env.NODE_ENV !== "test") {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Doom app listening on 0.0.0.0:${port}`);
  });
}
