/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Test fixture: stands in for `plane-agent-login <codex|gemini> <start|logout|status>`, speaking the
// same newline-delimited JSON protocol (events on stdout, `{"code"}` lines on stdin, logs on stderr).
// Options before the two positional arguments pick a scenario:
//   --scenario=ok|fail|crash|silent|stubborn|logout-fail   (default ok)
//   --connect-after=<ms>   codex start: report `connected` after this long (default: never)
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";

const args = process.argv.slice(2);
const [adapter, action] = args.slice(-2);
const options = Object.fromEntries(
  args
    .slice(0, -2)
    .map((arg) => /^--([^=]+)=(.*)$/.exec(arg))
    .filter(Boolean)
    .map((match) => [match[1], match[2]])
);
const scenario = options.scenario ?? "ok";
const home = process.env.HOME;
const emit = (event) => process.stdout.write(`${JSON.stringify(event)}\n`);
const forever = () => setInterval(() => {}, 1_000);

process.stderr.write(`fake-login ${adapter} ${action} (${scenario})\n`);
writeFileSync(
  path.join(home, `fake-login-${action}.json`),
  JSON.stringify({ args, cwd: process.cwd(), env: process.env })
);

const codexAuth = path.join(home, ".codex", "auth.json");
const geminiCreds = path.join(home, ".gemini", "oauth_creds.json");

if (action === "logout") {
  if (scenario === "logout-fail") {
    emit({ event: "failed", error: "could not remove the files" });
    process.exit(1);
  }
  rmSync(adapter === "codex" ? codexAuth : geminiCreds, { force: true });
  emit({ event: "disconnected" });
  process.exit(0);
}

if (action === "status") {
  const connected = existsSync(adapter === "codex" ? codexAuth : geminiCreds);
  emit({ event: "status", connected, ...(connected ? { account: { email: "ada@example.com" } } : {}) });
  process.exit(0);
}

// start
if (scenario === "crash") process.exit(3);
if (scenario === "silent") {
  process.stdin.resume();
  forever();
} else if (scenario === "fail") {
  emit({ event: "failed", error: "Device code sign-in is disabled for this account" });
  process.exit(1);
} else {
  process.stdout.write("this is not json\n");
  if (scenario === "stubborn") {
    process.on("SIGTERM", () => {});
    const grandchild = spawn("sleep", ["600"], { stdio: "ignore" });
    writeFileSync(path.join(home, "fake-login-pids"), `${process.pid} ${grandchild.pid}`);
  } else {
    process.on("SIGTERM", () => {
      writeFileSync(path.join(home, "fake-login-cancelled"), "1");
      process.exit(0);
    });
  }

  if (adapter === "codex") {
    emit({
      event: "pending",
      verificationUrl: "https://auth.openai.com/codex/device",
      userCode: "ABCD-1234",
      needsCode: false,
    });
    if (options["connect-after"]) {
      setTimeout(() => {
        mkdirSync(path.dirname(codexAuth), { recursive: true });
        writeFileSync(codexAuth, "{}");
        emit({ event: "connected", account: { email: "ada@example.com", plan: "plus" } });
        process.exit(0);
      }, Number(options["connect-after"]));
    }
    process.stdin.resume();
    forever();
  } else {
    emit({
      event: "pending",
      verificationUrl: "https://accounts.google.com/o/oauth2/v2/auth?client_id=x&state=y",
      needsCode: true,
    });
    const lines = createInterface({ input: process.stdin });
    lines.once("line", (line) => {
      const { code } = JSON.parse(line);
      if (code !== "good-code") {
        emit({ event: "failed", error: "The code was not accepted" });
        process.exit(1);
      }
      mkdirSync(path.dirname(geminiCreds), { recursive: true });
      writeFileSync(geminiCreds, "{}");
      emit({ event: "connected", account: { email: "ada@example.com" } });
      process.exit(0);
    });
    forever();
  }
}
