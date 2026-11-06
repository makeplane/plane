/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { Ajv2020, type ValidateFunction } from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { PACKAGE_ROOT } from "./helpers/client.ts";

/**
 * Every frame an agent wrote in the golden corpus must validate against the ACP v1 JSON schema
 * shipped with the pinned SDK (see acp-version.lock.json). The schema's top-level `Agent` union
 * also admits extension messages with any method and any result, so each frame is checked against
 * the specific definition for its method, or, for a response, for the request it answers.
 */
const require = createRequire(import.meta.url);
const schema = JSON.parse(readFileSync(require.resolve("@agentclientprotocol/sdk/schema/v1/schema.json"), "utf8"));
// The schema uses Rust-style integer formats (int64, uint32, ...); only their types matter here.
const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: false });
ajv.addSchema(schema, "acp");
const defs = new Map<string, ValidateFunction>();
const def = (name: string): ValidateFunction => {
  let validate = defs.get(name);
  if (!validate) {
    if (!schema.$defs[name]) throw new Error(`no $defs/${name} in the ACP schema`);
    validate = ajv.compile({ $ref: `acp#/$defs/${name}` });
    defs.set(name, validate);
  }
  return validate;
};

const AGENT_NOTIFICATIONS: Record<string, string> = { "session/update": "SessionNotification" };
const AGENT_REQUESTS: Record<string, string> = { "session/request_permission": "RequestPermissionRequest" };
const RESPONSES: Record<string, string> = {
  initialize: "InitializeResponse",
  "session/new": "NewSessionResponse",
  "session/load": "LoadSessionResponse",
  "session/list": "ListSessionsResponse",
  "session/prompt": "PromptResponse",
  "session/set_mode": "SetSessionModeResponse",
  "session/set_config_option": "SetSessionConfigOptionResponse",
};

/** Problems with one agent frame, given the methods of the client requests by id. */
function frameProblems(frame: any, requests: ReadonlyMap<unknown, string>): string[] {
  const check = (name: string, value: unknown): string[] => {
    const validate = def(name);
    return validate(value) ? [] : [`${name}: ${ajv.errorsText(validate.errors)}`];
  };
  if (frame.jsonrpc !== "2.0") return ["not JSON-RPC 2.0"];
  if (typeof frame.method === "string") {
    const name = frame.id === undefined ? AGENT_NOTIFICATIONS[frame.method] : AGENT_REQUESTS[frame.method];
    return name ? check(name, frame.params) : [`agents must not send ${frame.method}`];
  }
  if ("error" in frame) return check("Error", frame.error);
  const method = requests.get(frame.id);
  if (!method) return [`response to unknown request ${JSON.stringify(frame.id)}`];
  const name = RESPONSES[method];
  return name ? check(name, frame.result) : [`no response schema for ${method}`];
}

/** Client request ids → methods, from a pipe input or a script. */
function clientRequests(input: string): Map<unknown, string> {
  const requests = new Map<unknown, string>();
  for (const line of input.split("\n")) {
    let message: any;
    try {
      message = JSON.parse(line);
    } catch {
      continue;
    }
    const sent = message?.send ?? message;
    if (sent && typeof sent.method === "string" && sent.id !== undefined) requests.set(sent.id, sent.method);
  }
  return requests;
}

const manifest = JSON.parse(readFileSync(path.join(PACKAGE_ROOT, "tests/golden/manifest.json"), "utf8")) as {
  cases: Array<{ id: string; input: string; expected: string }>;
};

const sessionUpdate = (update: Record<string, unknown>) => ({
  jsonrpc: "2.0",
  method: "session/update",
  params: { sessionId: "s", update },
});

describe("ACP v1 schema", () => {
  it("rejects malformed agent frames", () => {
    const requests = new Map<unknown, string>([[1, "session/prompt"]]);
    expect(
      frameProblems(
        sessionUpdate({ sessionUpdate: "agent_message_chunk", content: { type: "text", text: "hi" } }),
        requests
      )
    ).toEqual([]);
    expect(frameProblems(sessionUpdate({ sessionUpdate: "tool_call", toolCallId: "t" }), requests)).not.toEqual([]);
    expect(frameProblems(sessionUpdate({ sessionUpdate: "made_up" }), requests)).not.toEqual([]);
    expect(frameProblems({ jsonrpc: "2.0", id: 1, result: { stopReason: "finished" } }, requests)).not.toEqual([]);
    expect(frameProblems({ jsonrpc: "2.0", method: "fs/read_text_file", id: 3, params: {} }, requests)).not.toEqual([]);
  });

  for (const entry of manifest.cases) {
    it(`${entry.id} writes only schema-valid agent frames`, () => {
      const golden = path.join(PACKAGE_ROOT, "tests/golden");
      const requests = clientRequests(readFileSync(path.join(golden, entry.input), "latin1"));
      const lines = readFileSync(path.join(golden, entry.expected), "utf8").split("\n").filter(Boolean);
      const problems = lines.flatMap((line, index) =>
        frameProblems(JSON.parse(line), requests).map((problem) => `${entry.expected}:${index + 1} ${problem}`)
      );
      expect(problems).toEqual([]);
    });
  }
});
