/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { ensureAPITrailingSlash, normalizeAPIRequestURL } from "./url";

describe("ensureAPITrailingSlash", () => {
  it.each([
    ["/api/foo", "/api/foo/"],
    ["/api/foo/", "/api/foo/"],
    ["/api/foo?x=1", "/api/foo/?x=1"],
    ["/api/foo#frag", "/api/foo/#frag"],
    ["", ""],
    ["/", "/"],
    ["/api/foo/?x=1", "/api/foo/?x=1"],
    ["https://h/api/foo", "https://h/api/foo/"],
  ])("turns %j into %j", (input, expected) => {
    expect(ensureAPITrailingSlash(input)).toBe(expected);
  });
});

describe("normalizeAPIRequestURL", () => {
  it("leaves signed upload URLs unchanged when baseURL is empty", () => {
    const signedUrl = "https://bucket.s3.amazonaws.com/path?X-Amz-Signature=abc";
    expect(normalizeAPIRequestURL(signedUrl, "")).toBe(signedUrl);
  });

  it("leaves signed upload URLs unchanged when origin is not the API baseURL", () => {
    const signedUrl = "https://bucket.s3.amazonaws.com/path?X-Amz-Signature=abc";
    expect(normalizeAPIRequestURL(signedUrl, "https://api.plane.so")).toBe(signedUrl);
  });

  it("leaves already-slashed relative Django paths unchanged", () => {
    expect(normalizeAPIRequestURL("/api/assets/v2/workspaces/acme/", "https://api.plane.so")).toBe(
      "/api/assets/v2/workspaces/acme/"
    );
  });

  it("adds a trailing slash to relative Django paths", () => {
    expect(normalizeAPIRequestURL("/api/assets/v2/workspaces/acme", "https://api.plane.so")).toBe(
      "/api/assets/v2/workspaces/acme/"
    );
  });

  it("adds a trailing slash to same-origin absolute Django URLs", () => {
    expect(normalizeAPIRequestURL("https://api.plane.so/api/foo", "https://api.plane.so")).toBe(
      "https://api.plane.so/api/foo/"
    );
  });
});
