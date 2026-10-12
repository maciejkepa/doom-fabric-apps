import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import { test } from "node:test";

test("Fabric build contains exactly the public assets, preserving binary contents", async () => {
  execFileSync(process.execPath, ["scripts/build.js"], {
    cwd: new URL("../", import.meta.url),
  });
  const source = new URL("../public/", import.meta.url);
  const output = new URL("../dist/", import.meta.url);
  const files = (await readdir(source, { recursive: true })).sort();
  assert.deepEqual((await readdir(output, { recursive: true })).sort(), files);
  for (const file of files) {
    if (!(await stat(new URL(file, source))).isFile()) continue;
    assert.deepEqual(await readFile(new URL(file, output)), await readFile(new URL(file, source)));
  }
});
