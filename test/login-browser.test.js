import assert from "node:assert/strict";
import { test } from "node:test";
import { acquireByManualBrowser } from "../scripts/login-browser.js";

test("manual browser login prints the full URL and keeps the standard OAuth flow", async (t) => {
  const messages = [];
  t.mock.method(console, "log", (message) => messages.push(message));
  const url = "https://login.microsoftonline.com/example?state=test&code_challenge=test";
  const result = {};
  const pca = {
    acquireTokenInteractive: async (request) => {
      assert.deepEqual(request.scopes, ["test-scope"]);
      assert.equal(request.responseMode, "form_post");
      assert.equal(request.prompt, "select_account");
      await request.openBrowser(url);
      return result;
    },
  };
  assert.equal(await acquireByManualBrowser(pca, ["test-scope"], true), result);
  assert.ok(messages.includes(url));
});
