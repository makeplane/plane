import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { PROTOCOL_VERSION } from "@agentclientprotocol/sdk";
import { describe, expect, it } from "vitest";

import { CLAUDE_MODELS } from "../src/claude/index.ts";
import { DEEPSEEK_MODELS } from "../src/deepseek/index.ts";
import { PACKAGE_ROOT } from "./helpers/client.ts";

/**
 * The ACP version lock: the SDK release, the wire protocol and the schema those adapters were
 * written and tested against, plus the golden corpus hash. Bumping any of them is a deliberate
 * change: update the lock in the same commit, after re-recording and reviewing the goldens.
 */
const lock = JSON.parse(readFileSync(path.join(PACKAGE_ROOT, "acp-version.lock.json"), "utf8"));
const require = createRequire(import.meta.url);
const sha256 = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
const repoRoot = path.resolve(PACKAGE_ROOT, "../..");

describe("acp-version.lock.json", () => {
  // The package exports its schema but not package.json; resolve the schema and walk up.
  const sdkRoot = path.resolve(
    path.dirname(require.resolve("@agentclientprotocol/sdk/schema/v1/schema.json")),
    "../.."
  );

  it("matches the installed SDK and the pnpm lockfile", () => {
    const installed = JSON.parse(readFileSync(path.join(sdkRoot, "package.json"), "utf8"));
    expect(installed.version).toBe(lock.sdk.version);
    const pnpmLock = readFileSync(path.join(repoRoot, "pnpm-lock.yaml"), "utf8");
    expect(pnpmLock).toContain(
      `'${lock.sdk.package}@${lock.sdk.version}':\n    resolution: {integrity: ${lock.sdk.integrity}}`
    );
    const catalog = readFileSync(path.join(repoRoot, "pnpm-workspace.yaml"), "utf8");
    expect(catalog).toContain(`"${lock.sdk.package}": "${lock.sdk.version}"`);
    for (const [name, version] of Object.entries(lock.providers)) {
      if (name.startsWith("@")) expect(catalog, name).toContain(`"${name}": "${version as string}"`);
    }
  });

  it("pins the wire protocol and schema", () => {
    expect(PROTOCOL_VERSION).toBe(lock.wire_protocol);
    const schema = lock.schema.assets.schema_json;
    expect(sha256(path.join(sdkRoot, schema.path))).toBe(schema.sha256);
  });

  it("pins the golden corpus", () => {
    const manifest = path.join(PACKAGE_ROOT, lock.corpus.manifest_path);
    expect(sha256(manifest), "the golden corpus changed: review it, then update corpus.sha256").toBe(
      lock.corpus.sha256
    );
  });

  it("lists the models the adapters default to", () => {
    expect(DEEPSEEK_MODELS.map((model) => model.value)).toEqual(lock.providers.deepseek_models);
    expect(CLAUDE_MODELS[0].value).toBe("claude-opus-5-5");
  });
});
