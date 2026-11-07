/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* oxlint-disable no-await-in-loop -- waiting for helper output */
import { spawn, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { GEMINI_OAUTH, authorizationCode, geminiOAuthClient } from "../src/login/gemini.ts";
import { binPath, tempDir } from "./helpers/client.ts";
import { fakeCodexEnv } from "./helpers/codex.ts";

const TEST_CLIENT = { clientId: "123-test.apps.googleusercontent.com", clientSecret: "test-secret" };

interface HelperRun {
  readonly child: ChildProcess;
  next(): Promise<Record<string, any>>;
  write(value: unknown): void;
  exit(): Promise<number>;
  stderr(): string;
}

function runHelper(args: string[], env: Record<string, string | undefined>): HelperRun {
  const child = spawn(process.execPath, [binPath("login"), ...args], {
    env: { ...process.env, ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });
  const events: Record<string, any>[] = [];
  let buffer = "";
  let stderr = "";
  child.stdout!.on("data", (chunk: Buffer) => {
    buffer += chunk.toString();
    for (let newline = buffer.indexOf("\n"); newline >= 0; newline = buffer.indexOf("\n")) {
      events.push(JSON.parse(buffer.slice(0, newline)));
      buffer = buffer.slice(newline + 1);
    }
  });
  child.stderr!.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });
  const exited = new Promise<number>((resolve) => child.once("exit", (code) => resolve(code ?? -1)));
  return {
    child,
    async next() {
      const deadline = Date.now() + 10_000;
      while (!events.length) {
        if (Date.now() > deadline) throw new Error(`no event; stderr:\n${stderr}`);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      return events.shift()!;
    },
    write: (value) => child.stdin!.write(`${JSON.stringify(value)}\n`),
    exit: () => exited,
    stderr: () => stderr,
  };
}

describe("plane-agent-login codex", () => {
  it("signs in with a ChatGPT device code", async () => {
    const fake = fakeCodexEnv({ OPENAI_API_KEY: "sk-must-not-be-used" });
    const run = runHelper(["codex", "start"], fake.env);
    expect(await run.next()).toEqual({
      event: "pending",
      verificationUrl: "https://auth.openai.com/codex/device",
      userCode: "ABCD-1234",
      needsCode: false,
    });
    expect(await run.next()).toEqual({ event: "connected", account: { email: "dev@example.com", plan: "plus" } });
    expect(await run.exit()).toBe(0);
    const codexHome = path.join(fake.env.HOME!, ".codex");
    expect(fake.log()[0]?.start).toEqual({ codexHome, apiKeyInEnv: false });
    expect(fake.log().find((message) => message.method === "account/login/start")?.params).toEqual({
      type: "chatgptDeviceCode",
    });
    expect(existsSync(path.join(codexHome, "auth.json"))).toBe(true);

    const status = runHelper(["codex", "status"], { ...fake.env, FAKE_CODEX_ACCOUNT: "chatgpt" });
    expect(await status.next()).toEqual({
      event: "status",
      connected: true,
      account: { email: "dev@example.com", plan: "plus" },
    });
    expect(await status.exit()).toBe(0);

    const logout = runHelper(["codex", "logout"], fake.env);
    expect(await logout.next()).toEqual({ event: "disconnected" });
    expect(await logout.exit()).toBe(0);
    expect(existsSync(path.join(codexHome, "auth.json"))).toBe(false);

    const after = runHelper(["codex", "status"], fake.env);
    expect(await after.next()).toEqual({ event: "status", connected: false });
  });

  it("reports a failed sign-in, and cancels the login on SIGTERM", async () => {
    const failing = runHelper(["codex", "start"], fakeCodexEnv({ FAKE_CODEX_LOGIN: "fail" }).env);
    expect((await failing.next()).event).toBe("pending");
    expect(await failing.next()).toEqual({ event: "failed", error: "device code expired" });
    expect(await failing.exit()).toBe(1);

    const fake = fakeCodexEnv({ FAKE_CODEX_LOGIN: "hang" });
    const hanging = runHelper(["codex", "start"], fake.env);
    expect((await hanging.next()).event).toBe("pending");
    hanging.child.kill("SIGTERM");
    expect(await hanging.next()).toEqual({ event: "failed", error: "the ChatGPT sign-in was cancelled" });
    expect(await hanging.exit()).toBe(1);
    expect(fake.log().find((message) => message.method === "account/login/cancel")?.params).toEqual({
      loginId: "login-1",
    });
  });

  it("refuses unknown arguments", async () => {
    const run = runHelper(["claude", "start"], {});
    expect((await run.next()).event).toBe("failed");
    expect(await run.exit()).toBe(2);
  });
});

describe("plane-agent-login gemini", () => {
  let server: Server;
  let base: string;
  const challenges: string[] = [];
  beforeAll(async () => {
    server = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        res.setHeader("content-type", "application/json");
        if (req.url === "/token") {
          const form = new URLSearchParams(body);
          const verifier = form.get("code_verifier") ?? "";
          const challenge = createHash("sha256").update(verifier).digest("base64url");
          const valid =
            form.get("code") === "good-code" &&
            challenges.includes(challenge) &&
            form.get("client_id") === TEST_CLIENT.clientId &&
            form.get("client_secret") === TEST_CLIENT.clientSecret &&
            form.get("redirect_uri") === GEMINI_OAUTH.redirectUri &&
            form.get("grant_type") === "authorization_code";
          res.statusCode = valid ? 200 : 400;
          res.end(
            JSON.stringify(
              valid
                ? {
                    access_token: "ya29.test",
                    expires_in: 3599,
                    refresh_token: "1//refresh",
                    scope: GEMINI_OAUTH.scopes.join(" "),
                    token_type: "Bearer",
                    id_token: "eyJ.test",
                  }
                : { error: "invalid_grant", error_description: "Malformed auth code." }
            )
          );
          return;
        }
        if (req.url === "/userinfo" && req.headers.authorization === "Bearer ya29.test") {
          res.end(JSON.stringify({ email: "dev@example.com" }));
          return;
        }
        res.statusCode = 404;
        res.end("{}");
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  const envFor = (home: string) => ({
    HOME: home,
    PLANE_GEMINI_OAUTH_TOKEN_URL: `${base}/token`,
    PLANE_GEMINI_USERINFO_URL: `${base}/userinfo`,
    PLANE_GEMINI_OAUTH_CLIENT_ID: TEST_CLIENT.clientId,
    PLANE_GEMINI_OAUTH_CLIENT_SECRET: TEST_CLIENT.clientSecret,
  });

  it("signs in with PKCE and caches the credentials where Gemini CLI reads them", async () => {
    const home = tempDir("gemini-login-");
    const geminiDir = path.join(home, ".gemini");
    mkdirSync(geminiDir, { recursive: true });
    writeFileSync(path.join(geminiDir, "settings.json"), JSON.stringify({ ui: { theme: "x" } }));
    const run = runHelper(["gemini", "start"], envFor(home));
    const pending = await run.next();
    expect(pending).toMatchObject({ event: "pending", needsCode: true });
    const url = new URL(pending.verificationUrl);
    expect(`${url.origin}${url.pathname}`).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      client_id: TEST_CLIENT.clientId,
      redirect_uri: "https://codeassist.google.com/authcode",
      response_type: "code",
      scope: GEMINI_OAUTH.scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
      code_challenge_method: "S256",
    });
    expect(url.searchParams.get("state")).toMatch(/^[0-9a-f]{64}$/);
    challenges.push(url.searchParams.get("code_challenge")!);

    run.write({ code: "good-code" });
    expect(await run.next()).toEqual({ event: "connected", account: { email: "dev@example.com" } });
    expect(await run.exit()).toBe(0);

    const credsFile = path.join(geminiDir, "oauth_creds.json");
    const creds = JSON.parse(readFileSync(credsFile, "utf8"));
    expect(creds).toMatchObject({
      access_token: "ya29.test",
      refresh_token: "1//refresh",
      scope: GEMINI_OAUTH.scopes.join(" "),
      token_type: "Bearer",
      id_token: "eyJ.test",
    });
    expect(creds.expiry_date).toBeGreaterThan(Date.now());
    expect(statSync(credsFile).mode & 0o777).toBe(0o600);
    expect(JSON.parse(readFileSync(path.join(geminiDir, "settings.json"), "utf8"))).toEqual({
      ui: { theme: "x" },
      security: { auth: { selectedType: "oauth-personal" } },
    });
    expect(JSON.parse(readFileSync(path.join(geminiDir, "google_accounts.json"), "utf8"))).toEqual({
      active: "dev@example.com",
      old: [],
    });

    const status = runHelper(["gemini", "status"], envFor(home));
    expect(await status.next()).toEqual({ event: "status", connected: true, account: { email: "dev@example.com" } });

    const logout = runHelper(["gemini", "logout"], envFor(home));
    expect(await logout.next()).toEqual({ event: "disconnected" });
    expect(await logout.exit()).toBe(0);
    expect(existsSync(credsFile)).toBe(false);
    expect(existsSync(path.join(geminiDir, "google_accounts.json"))).toBe(false);
    expect(JSON.parse(readFileSync(path.join(geminiDir, "settings.json"), "utf8"))).toEqual({
      ui: { theme: "x" },
      security: { auth: {} },
    });
    const after = runHelper(["gemini", "status"], envFor(home));
    expect(await after.next()).toEqual({ event: "status", connected: false });
  });

  it("fails on a bad code without writing anything", async () => {
    const home = tempDir("gemini-login-");
    const run = runHelper(["gemini", "start"], envFor(home));
    const pending = await run.next();
    challenges.push(new URL(pending.verificationUrl).searchParams.get("code_challenge")!);
    run.write({ code: "bad-code" });
    expect(await run.next()).toEqual({
      event: "failed",
      error: "Google rejected the authorization code: Malformed auth code.",
    });
    expect(await run.exit()).toBe(1);
    expect(existsSync(path.join(home, ".gemini", "oauth_creds.json"))).toBe(false);
  });

  it("accepts a pasted redirect URL and checks its state", () => {
    expect(authorizationCode({ code: " 4/abc " }, "s")).toBe("4/abc");
    expect(authorizationCode({ code: "https://codeassist.google.com/authcode?code=4%2Fabc&state=s" }, "s")).toBe(
      "4/abc"
    );
    expect(authorizationCode({ code: "https://codeassist.google.com/authcode?code=4%2Fabc&state=x" }, "s")).toBe(
      undefined
    );
    expect(authorizationCode({}, "s")).toBe(undefined);
  });
});

describe("geminiOAuthClient", () => {
  it("reads Gemini CLI's OAuth client from the bundle of the gemini on PATH", () => {
    const root = tempDir("gemini-bundle-");
    const bundle = path.join(root, "lib", "node_modules", "@google", "gemini-cli", "bundle");
    mkdirSync(bundle, { recursive: true });
    writeFileSync(path.join(bundle, "gemini.js"), "#!/usr/bin/env node\nimport './chunk-A.js';\n");
    writeFileSync(
      path.join(bundle, "chunk-A.js"),
      'var x = 1;\nvar OAUTH_CLIENT_ID = "42-abc.apps.googleusercontent.com";\nvar OAUTH_CLIENT_SECRET = "GOCSPX-fake_Secret-1";\n'
    );
    const binDir = path.join(root, "bin");
    mkdirSync(binDir);
    symlinkSync(path.join(bundle, "gemini.js"), path.join(binDir, "gemini"));
    expect(geminiOAuthClient({ PATH: `/nonexistent${path.delimiter}${binDir}` })).toEqual({
      clientId: "42-abc.apps.googleusercontent.com",
      clientSecret: "GOCSPX-fake_Secret-1",
    });
  });

  it("prefers the env override and fails clearly without a gemini on PATH", () => {
    expect(
      geminiOAuthClient({ PLANE_GEMINI_OAUTH_CLIENT_ID: "a", PLANE_GEMINI_OAUTH_CLIENT_SECRET: "b", PATH: "" })
    ).toEqual({ clientId: "a", clientSecret: "b" });
    expect(() => geminiOAuthClient({ PATH: tempDir("empty-path-") })).toThrow(/not installed/);
  });
});
