import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveGodModeUrl } from "../helpers/admin-url.helper.ts";

describe("resolveGodModeUrl", () => {
  it("keeps localhost and uses the configured admin port", () => {
    assert.equal(
      resolveGodModeUrl("http://localhost:3000/public/", "http://localhost:3001/god-mode"),
      "http://localhost:3001/god-mode/"
    );
  });

  it("inherits a LAN hostname while retaining the configured admin port", () => {
    assert.equal(
      resolveGodModeUrl("http://192.168.3.245:3000/public/", "http://localhost:3001/god-mode"),
      "http://192.168.3.245:3001/god-mode/"
    );
  });

  it("inherits a Tailscale hostname and the current protocol", () => {
    assert.equal(
      resolveGodModeUrl("https://plane.tailnet.ts.net/public/", "http://localhost:3001/god-mode/"),
      "https://plane.tailnet.ts.net:3001/god-mode/"
    );
  });

  it("keeps the current port for a same-origin admin path", () => {
    assert.equal(
      resolveGodModeUrl("https://plane.example.com/app/", "/god-mode"),
      "https://plane.example.com/god-mode/"
    );
  });

  it("does not duplicate an existing trailing slash", () => {
    assert.equal(
      resolveGodModeUrl("http://localhost:3000/", "http://localhost:3001/god-mode/"),
      "http://localhost:3001/god-mode/"
    );
  });

  it("normalizes the configured URL when no browser URL is available", () => {
    assert.equal(resolveGodModeUrl(undefined, "http://localhost:3001/god-mode"), "http://localhost:3001/god-mode/");
  });

  it("falls back to the configured value when it cannot be parsed", () => {
    assert.equal(resolveGodModeUrl("not a URL", "/god-mode"), "/god-mode/");
  });

  it("preserves an empty configured fallback", () => {
    assert.equal(resolveGodModeUrl(undefined, ""), "");
  });
});
