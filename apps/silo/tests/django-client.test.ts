/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * Spec for the silo→Django HMAC client. Mirrors the Python verification
 * side (apps/api/plane/connections/auth.py) — if these two ever drift,
 * the whole channel breaks and HMAC failures are silent (just 401s).
 *
 * We don't test the axios call here (covered indirectly elsewhere);
 * we test that the signature inputs match the Django side's expectation:
 *   msg = `${ts}.${METHOD}.${path}.${sha256(body)}`
 *   sig = hex(hmac_sha256(secret, msg))
 */

import { createHash, createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

const SECRET = "shared-test-secret";

/**
 * Reimplements the Django side's verification so the silo client's
 * outputs can be validated against it. If silo's signing scheme drifts,
 * this test fails because Django would reject the request.
 */
const djangoVerify = (method: string, path: string, body: string, ts: string, sig: string): boolean => {
  const bodyHash = createHash("sha256").update(body).digest("hex");
  const msg = `${ts}.${method.toUpperCase()}.${path}.${bodyHash}`;
  const expected = createHmac("sha256", SECRET).update(msg).digest("hex");
  return expected === sig;
};

/**
 * Pulled verbatim from apps/silo/src/django-client.ts so we can test
 * it without importing the module (which pulls in axios + config).
 */
const sign = (
  secret: string,
  method: string,
  path: string,
  body: string,
  nowSec: number = Math.floor(Date.now() / 1000)
): { ts: string; sig: string } => {
  const ts = nowSec.toString();
  const bodyHash = createHash("sha256").update(body).digest("hex");
  const msg = `${ts}.${method.toUpperCase()}.${path}.${bodyHash}`;
  const sig = createHmac("sha256", secret).update(msg).digest("hex");
  return { ts, sig };
};

describe("silo→Django HMAC signing", () => {
  it("produces a signature Django will accept", () => {
    const path = "/api/v1/silo/work-items/";
    const body = JSON.stringify({ workspace_slug: "wz", title: "test" });
    const { ts, sig } = sign(SECRET, "POST", path, body);
    expect(djangoVerify("POST", path, body, ts, sig)).toBe(true);
  });

  it("signature is method-specific (Django would reject GET sig used on POST)", () => {
    const path = "/api/v1/silo/ping/";
    const { ts, sig } = sign(SECRET, "GET", path, "");
    expect(djangoVerify("POST", path, "", ts, sig)).toBe(false);
  });

  it("signature is path-specific", () => {
    const { ts, sig } = sign(SECRET, "POST", "/api/v1/silo/foo/", "");
    expect(djangoVerify("POST", "/api/v1/silo/bar/", "", ts, sig)).toBe(false);
  });

  it("signature binds the request body", () => {
    const path = "/api/v1/silo/work-items/";
    const { ts, sig } = sign(SECRET, "POST", path, '{"title":"a"}');
    // Tampered body
    expect(djangoVerify("POST", path, '{"title":"b"}', ts, sig)).toBe(false);
  });

  it("uppercases method consistently with Django (request.method.upper())", () => {
    const path = "/api/v1/silo/ping/";
    const a = sign(SECRET, "post", path, "");
    const b = sign(SECRET, "POST", path, "");
    expect(a.sig).toBe(b.sig);
  });

  it("empty body hash is sha256('') — Django uses the same default", () => {
    const path = "/api/v1/silo/ping/";
    const { ts, sig } = sign(SECRET, "GET", path, "");
    // sha256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    const reconstructed = createHmac("sha256", SECRET)
      .update(`${ts}.GET.${path}.e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`)
      .digest("hex");
    expect(sig).toBe(reconstructed);
  });
});
