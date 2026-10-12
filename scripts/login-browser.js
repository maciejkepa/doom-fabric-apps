import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";
import { RayfinAuth } from "@microsoft/rayfin-cli/auth";

export async function acquireByManualBrowser(pca, scopes, forceAccountSelect) {
  return pca.acquireTokenInteractive({
    scopes,
    responseMode: "form_post",
    ...(forceAccountSelect && { prompt: "select_account" }),
    openBrowser: async (url) => {
      console.log("\nOpen this entire URL in your Windows browser:");
      console.log(url);
      console.log("\nKeep this terminal running until sign-in completes.");
    },
    successTemplate: "<h1>Authentication successful</h1><p>You can close this window.</p>",
    errorTemplate: "<h1>Authentication failed</h1><p>Error: {{error}}</p>",
  });
}

async function runLogin() {
  const metadata = JSON.parse(await readFile(
    new URL(import.meta.resolve("@microsoft/rayfin-cli/package.json")), "utf8",
  ));
  if (metadata.version !== "1.36.2") {
    throw new Error("Review the login workaround before using a different Rayfin version.");
  }
  RayfinAuth.prototype.acquireTokenInteractive = acquireByManualBrowser;
  process.argv.splice(2, 0, "login");
  const { cli } = await import("@microsoft/rayfin-cli");
  try {
    await cli.parseAsync(process.argv);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await runLogin();
}
