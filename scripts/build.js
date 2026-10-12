import { cp, rm } from "node:fs/promises";

const output = new URL("../dist/", import.meta.url);
await rm(output, { recursive: true, force: true });
await cp(new URL("../public/", import.meta.url), output, { recursive: true });
console.log("Copied UI, WebAssembly engine, and game data to dist/.");
