import assert from "node:assert/strict";
import { after, before, test } from "node:test";

process.env.NODE_ENV = "test";
const { app } = await import("../server.js");

let origin;

before(async () => {
  await new Promise((resolve) => app.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${app.address().port}`;
});

after(async () => {
  app.closeAllConnections();
  await new Promise((resolve, reject) => app.close((error) => error ? reject(error) : resolve()));
});

test("serves the application", async () => {
  const response = await fetch(`${origin}/`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^text\/html/);
  assert.match(await response.text(), /DOOM \/\/ Fabric Apps/);
});

test("serves WebAssembly with the correct MIME type", async () => {
  const response = await fetch(`${origin}/vendor/doomgeneric/doomgeneric.wasm`, { method: "HEAD" });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/wasm");
  assert.ok(Number(response.headers.get("content-length")) > 1_000_000);
});

test("resolves Emscripten assets relative to the application script", async () => {
  const response = await fetch(`${origin}/app.js`);
  const source = await response.text();
  assert.equal(response.status, 200);
  assert.match(source, /locateFile: \(fileName\) => new URL\(fileName, engineBaseUrl\)\.href/);
  assert.match(source, /new URL\("\.\/vendor\/doomgeneric\/", appScriptUrl\)/);
});

test("provides a health endpoint", async () => {
  const response = await fetch(`${origin}/health`);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("does not expose files outside public", async () => {
  const response = await fetch(`${origin}/..%2fpackage.json`);
  assert.equal(response.status, 403);
});
