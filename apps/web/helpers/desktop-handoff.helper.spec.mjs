/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveDesktopHandoffRedirect } from "./desktop-handoff.helper.ts";

describe("resolveDesktopHandoffRedirect", () => {
  it("decodes a version 1 desktop handoff for the current instance", () => {
    const searchParams = new URLSearchParams({
      v: "1",
      o: "aHR0cHM6Ly9hcHAucGxhbmUuc28",
      p: "L2QvYXV0aC8_dG9rZW49b25lLXRpbWUtdG9rZW4",
    });

    assert.equal(resolveDesktopHandoffRedirect(searchParams, "https://app.plane.so"), "/d/auth/?token=one-time-token");
  });

  it("rejects a handoff created for a different instance", () => {
    const searchParams = new URLSearchParams({
      v: "1",
      o: "aHR0cHM6Ly9ldmlsLmV4YW1wbGU",
      p: "L2QvYXV0aC8_dG9rZW49b25lLXRpbWUtdG9rZW4",
    });

    assert.equal(resolveDesktopHandoffRedirect(searchParams, "https://app.plane.so"), null);
  });

  it("rejects a cross-origin path", () => {
    const searchParams = new URLSearchParams({
      v: "1",
      o: "aHR0cHM6Ly9hcHAucGxhbmUuc28",
      p: "Ly9ldmlsLmV4YW1wbGUvc3RlYWw",
    });

    assert.equal(resolveDesktopHandoffRedirect(searchParams, "https://app.plane.so"), null);
  });

  it("rejects unsupported or malformed handoffs", () => {
    const unsupportedVersion = new URLSearchParams({
      v: "2",
      o: "aHR0cHM6Ly9hcHAucGxhbmUuc28",
      p: "L2QvYXV0aC8_dG9rZW49b25lLXRpbWUtdG9rZW4",
    });
    const malformedPayload = new URLSearchParams({ v: "1", o: "%%%", p: "%%%" });

    assert.equal(resolveDesktopHandoffRedirect(unsupportedVersion, "https://app.plane.so"), null);
    assert.equal(resolveDesktopHandoffRedirect(malformedPayload, "https://app.plane.so"), null);
  });
});
