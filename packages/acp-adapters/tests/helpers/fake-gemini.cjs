#!/usr/bin/env node
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
// Fake `gemini --acp` (Gemini CLI 0.65.0) for the Gemini adapter tests. It speaks ACP JSON-RPC 2.0
// over stdio with the shapes the real CLI uses (verified against 0.65.0, see the README): tool call
// ids `<tool>__<id>`, a `tool_call` (pending) before every `session/request_permission`, options
// `proceed_once` / `proceed_always*` / `cancel`, history streamed around the `session/load`
// response. Driven by the prompt text:
//   "hello" thought + message; "run" shell command; "read" read_file; "plane" / "plane list" Plane
//   MCP create / list; "wait" streams then waits for session/cancel; "fail" answers a 401; a prompt
//   starting with "/" runs a "command" (the adapter must prevent that); anything else answers "ok".
// Every message it receives is appended to $FAKE_GEMINI_LOG (JSONL), after a first line with its
// argv, pid and the env names the adapter controls. It also writes a non-JSON line to stdout and
// noise to stderr, like the real CLI, which the adapter must swallow.
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const log = process.env.FAKE_GEMINI_LOG;
const home = process.env.GEMINI_CLI_HOME || process.env.HOME || "/tmp";
const store = path.join(home, ".gemini", "fake-sessions.json");
const CONTROLLED = [
  "HOME",
  "GEMINI_CLI_HOME",
  "GEMINI_CLI_NO_RELAUNCH",
  "GEMINI_CLI_TRUST_WORKSPACE",
  "GEMINI_CLI_SYSTEM_SETTINGS_PATH",
  "GEMINI_TELEMETRY_ENABLED",
  "GEMINI_API_KEY",
  "PLANE_AGENT_AUTH",
  "KEEP_ME",
];

function record(entry) {
  if (log) fs.appendFileSync(log, `${JSON.stringify(entry)}\n`);
}

record({
  start: {
    argv: process.argv.slice(2),
    pid: process.pid,
    env: Object.fromEntries(CONTROLLED.filter((name) => name in process.env).map((name) => [name, process.env[name]])),
    secretNames: Object.keys(process.env).filter((name) => /KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL/i.test(name)),
  },
});

let buffer = "";
let nextRequest = 0;
let authenticated = false;
let callCounter = 0;
const pendingReplies = new Map();
const active = new Map();

function send(payload) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", ...payload })}\n`);
}

function update(sessionId, value) {
  send({ method: "session/update", params: { sessionId, update: value } });
}

function ask(method, params) {
  const id = nextRequest++;
  send({ id, method, params });
  return new Promise((resolve) => pendingReplies.set(id, resolve));
}

function readStore() {
  try {
    return JSON.parse(fs.readFileSync(store, "utf8"));
  } catch {
    return {};
  }
}

function writeStore(sessions) {
  fs.mkdirSync(path.dirname(store), { recursive: true });
  fs.writeFileSync(store, JSON.stringify(sessions));
}

function remember(sessionId, entries) {
  const sessions = readStore();
  sessions[sessionId] = [...(sessions[sessionId] || []), ...entries];
  writeStore(sessions);
}

const models = {
  availableModels: [
    { modelId: "auto", name: "Auto", description: "Let Gemini CLI decide the best model for the task" },
    { modelId: "gemini-2.5-pro", name: "gemini-2.5-pro" },
    { modelId: "gemini-2.5-flash", name: "gemini-2.5-flash" },
  ],
  currentModelId: "auto",
};

const modes = {
  availableModes: [
    { id: "default", name: "Default", description: "Prompts for approval" },
    { id: "autoEdit", name: "Auto Edit", description: "Auto-approves edit tools" },
    { id: "yolo", name: "YOLO", description: "Auto-approves all tools" },
  ],
  currentModeId: "default",
};

const message = (sessionId, text) =>
  update(sessionId, { sessionUpdate: "agent_message_chunk", content: { type: "text", text } });

async function tool(sessionId, name, title, kind, options) {
  const toolCallId = `${name}__${name}_${++callCounter}_0`;
  const call = { toolCallId, status: "pending", title, content: [], locations: [], kind };
  update(sessionId, { sessionUpdate: "tool_call", ...call });
  const reply = await ask("session/request_permission", { sessionId, options, toolCall: call });
  const outcome = reply.result && reply.result.outcome;
  const allowed = outcome && outcome.outcome === "selected" && String(outcome.optionId).startsWith("proceed");
  if (allowed) {
    update(sessionId, {
      sessionUpdate: "tool_call_update",
      toolCallId,
      status: "completed",
      title,
      content: [{ type: "content", content: { type: "text", text: "done" } }],
      locations: [],
      kind,
    });
  } else {
    update(sessionId, {
      sessionUpdate: "tool_call_update",
      toolCallId,
      status: "failed",
      content: [{ type: "content", content: { type: "text", text: `Tool "${name}" was canceled by the user.` } }],
      kind,
    });
  }
  return allowed;
}

const BASIC = [
  { optionId: "proceed_once", name: "Allow", kind: "allow_once" },
  { optionId: "cancel", name: "Reject", kind: "reject_once" },
];
const EXEC = [{ optionId: "proceed_always", name: "Allow for this session", kind: "allow_always" }, ...BASIC];
const MCP = [
  { optionId: "proceed_always_server", name: "Allow all server tools for this session", kind: "allow_always" },
  { optionId: "proceed_always_tool", name: "Allow tool for this session", kind: "allow_always" },
  ...BASIC,
];

async function runPrompt(msg) {
  const { sessionId, prompt } = msg.params;
  const text = prompt
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
  const done = (stopReason) => {
    active.delete(sessionId);
    send({ id: msg.id, result: { stopReason } });
  };
  if (text.trim().startsWith("/")) {
    message(sessionId, "COMMAND RAN");
    return done("end_turn");
  }
  const said = text.replace(/\u200B/g, "");
  remember(sessionId, [{ type: "user", text: said }]);
  switch (said) {
    case "hello":
      update(sessionId, {
        sessionUpdate: "agent_thought_chunk",
        content: { type: "text", text: "**Thinking**\nabout it" },
      });
      message(sessionId, "Hi ");
      message(sessionId, "there");
      update(sessionId, { sessionUpdate: "usage_update", used: 15, size: 1048576 });
      remember(sessionId, [{ type: "gemini", text: "Hi there" }]);
      return done("end_turn");
    case "run":
      message(
        sessionId,
        (await tool(sessionId, "run_shell_command", "touch a.txt", "execute", EXEC)) ? "ran it" : "skipped"
      );
      return done("end_turn");
    case "read":
      message(sessionId, (await tool(sessionId, "read_file", "a.txt", "read", EXEC)) ? "read it" : "skipped");
      return done("end_turn");
    case "plane":
      message(
        sessionId,
        (await tool(sessionId, "mcp_plane_workitem", "workitem(action: create, name: T)", "other", MCP))
          ? "created"
          : "not created"
      );
      return done("end_turn");
    case "plane list":
      message(
        sessionId,
        (await tool(sessionId, "mcp_plane_workitem", "workitem(action: list)", "other", MCP)) ? "listed" : "not listed"
      );
      return done("end_turn");
    case "wait":
      message(sessionId, "working");
      active.set(sessionId, () => done("cancelled"));
      return;
    case "fail":
      active.delete(sessionId);
      send({ id: msg.id, error: { code: 401, message: "API key not valid. Please pass a valid API key." } });
      return;
    default:
      message(sessionId, "ok");
      return done("end_turn");
  }
}

function handle(msg) {
  record(msg);
  if (msg.id !== undefined && !msg.method) {
    const resolve = pendingReplies.get(msg.id);
    pendingReplies.delete(msg.id);
    if (resolve) resolve(msg);
    return;
  }
  const params = msg.params || {};
  switch (msg.method) {
    case "initialize":
      send({
        id: msg.id,
        result: {
          protocolVersion: 1,
          authMethods: [
            { id: "oauth-personal", name: "Log in with Google" },
            { id: "gemini-api-key", name: "Gemini API key", _meta: { "api-key": { provider: "google" } } },
            { id: "vertex-ai", name: "Vertex AI" },
            { id: "gateway", name: "AI API Gateway" },
          ],
          agentInfo: { name: "gemini-cli", title: "Gemini CLI", version: "0.65.0" },
          agentCapabilities: {
            loadSession: true,
            promptCapabilities: { image: true, audio: true, embeddedContext: true },
            mcpCapabilities: { http: true, sse: true },
          },
        },
      });
      return;
    case "authenticate": {
      const key = params._meta && params._meta["api-key"];
      const creds = path.join(home, ".gemini", "oauth_creds.json");
      if (params.methodId === "gemini-api-key" && key && key !== process.env.FAKE_GEMINI_REJECT) {
        authenticated = true;
        send({ id: msg.id, result: {} });
      } else if (params.methodId === "oauth-personal" && fs.existsSync(creds)) {
        authenticated = true;
        send({ id: msg.id, result: {} });
      } else {
        send({ id: msg.id, error: { code: -32000, message: "API key not valid. Please pass a valid API key." } });
      }
      return;
    }
    case "session/new": {
      if (!authenticated) {
        send({ id: msg.id, error: { code: -32000, message: "Authentication required." } });
        return;
      }
      const sessionId = `gem-session-${Object.keys(readStore()).length + 1}`;
      writeStore({ ...readStore(), [sessionId]: [] });
      send({ id: msg.id, result: { sessionId, modes, models } });
      setTimeout(() => update(sessionId, { sessionUpdate: "available_commands_update", availableCommands: [] }), 0);
      return;
    }
    case "session/load": {
      const history = readStore()[params.sessionId];
      if (!history) {
        send({
          id: msg.id,
          error: {
            code: -32603,
            message: "Internal error",
            data: { details: `Invalid session identifier "${params.sessionId}".` },
          },
        });
        return;
      }
      const sessionId = params.sessionId;
      update(sessionId, {
        sessionUpdate: "user_message_chunk",
        content: { type: "text", text: "<session_context>\nThis is the Gemini CLI.\n</session_context>" },
      });
      send({ id: msg.id, result: { modes, models } });
      for (const entry of history) {
        update(sessionId, {
          sessionUpdate: entry.type === "user" ? "user_message_chunk" : "agent_message_chunk",
          content: { type: "text", text: entry.text },
        });
      }
      update(sessionId, {
        sessionUpdate: "tool_call",
        toolCallId: "read_file__old_1",
        status: "completed",
        title: "a.txt",
        content: [],
        kind: "read",
      });
      update(sessionId, {
        sessionUpdate: "user_message_chunk",
        content: { type: "text", text: "[Function Response: read_file]" },
      });
      return;
    }
    case "session/set_model":
    case "session/set_mode":
      send({ id: msg.id, result: {} });
      return;
    case "session/prompt":
      void runPrompt(msg);
      return;
    case "session/cancel": {
      const cancel = active.get(params.sessionId);
      if (cancel) cancel();
      return;
    }
    default:
      if (msg.id !== undefined && msg.method)
        send({ id: msg.id, error: { code: -32601, message: `Method not found: ${msg.method}` } });
  }
}

process.stdout.write("\u001b[?1049hnot a protocol line\n");
process.stderr.write("fake gemini: started\n");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let newline;
  while ((newline = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (line) handle(JSON.parse(line));
  }
});
process.stdin.on("end", () => process.exit(0));
