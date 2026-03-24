/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";

// Mock @plane/logger before importing the module under test
vi.mock("@plane/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock env to avoid process.exit on missing env vars
vi.mock("../src/env", () => ({
  serverConfig: {
    nodeEnv: "test",
    port: 3000,
    timeoutMs: 5000,
    initTimeoutMs: 3000,
    memoryLimitMb: 128,
    apiBaseUrl: "http://localhost:8000",
  },
  env: {
    NODE_ENV: "test",
    PORT: 3000,
    EXECUTION_TIMEOUT_MS: 5000,
    INIT_TIMEOUT_MS: 3000,
    ISOLATE_MEMORY_MB: 128,
    API_BASE_URL: "http://localhost:8000",
  },
}));

// Mock PlaneClient — must be a real constructor (class) so `new` works
const mockPlaneClient = {
  workItem: { list: vi.fn().mockResolvedValue([{ id: "wi-1" }]) },
  project: { get: vi.fn().mockResolvedValue({ id: "proj-1" }) },
};

vi.mock("@makeplane/plane-node-sdk", () => {
  return {
    PlaneClient: class MockPlaneClient {
      constructor() {
        return mockPlaneClient;
      }
    },
  };
});

import { runInIsolate } from "../src/isolate-executor";
import type { RunnerConfig } from "../src/config";
import type { ExecutionContext, AutomationEventInput } from "../src/types";
import { ERunnerScriptType } from "@plane/types";

// Helper to write a bundle to a temp file
let tmpDir: string;

function makeRunnerConfig(overrides: Partial<RunnerConfig> = {}): RunnerConfig {
  return {
    workspaceSlug: "test-ws",
    taskId: "task-001",
    executionId: "exec-001",
    ...overrides,
  };
}

function makeEvent(overrides: Partial<AutomationEventInput> = {}): AutomationEventInput {
  return {
    event: {
      timestamp: Date.now(),
      publisher: "test",
      publisher_instance: "test-instance",
      version: "1.0",
      source: "test",
      outbox_id: 1,
      event_id: "evt-001",
      event_type: "work_item.created",
      entity_type: "work_item",
      entity_id: "entity-001",
      payload: { data: { title: "Test Item" }, previous_attributes: {} },
      workspace_id: "ws-001",
      project_id: "proj-001",
      initiator_id: "user-001",
      initiator_type: "user",
    },
    context: {
      automation_id: "auto-001",
      automation_run_id: "run-001",
    },
    ...overrides,
  };
}

function makeExecCtx(overrides: Partial<ExecutionContext> = {}): ExecutionContext {
  return {
    eventType: ERunnerScriptType.AUTOMATION,
    workspaceSlug: "test-ws",
    event: makeEvent(),
    env: { MY_VAR: "hello" },
    variables: { projectName: "Test Project" },
    allowedDomains: ["api.example.com"],
    accessToken: "test-token",
    baseUrl: "http://localhost:8000",
    functions: [],
    ...overrides,
  };
}

async function writeBundleFile(code: string): Promise<string> {
  const filePath = path.join(tmpDir, `bundle-${Date.now()}-${Math.random().toString(36).slice(2)}.js`);
  await fs.writeFile(filePath, code, "utf8");
  return filePath;
}

/**
 * Creates an IIFE bundle string that mimics esbuild output.
 * The provided body is the body of the async main function.
 * `main` receives (event, variables) as parameters.
 */
function makeBundle(mainBody: string): string {
  return `globalThis.main = async function main(event, variables) {\n${mainBody}\n};`;
}

describe("runInIsolate", () => {
  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "isolate-test-"));
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("executes code with AutomationEventInput and returns result", async () => {
    const bundle = makeBundle(`
      var eventType = event.event.event_type;
      var automationId = event.context.automation_id;
      return { eventType: eventType, automationId: automationId };
    `);
    const bundlePath = await writeBundleFile(bundle);

    const result = await runInIsolate(makeRunnerConfig(), makeExecCtx(), bundlePath);

    expect(result.value).toEqual({
      eventType: "work_item.created",
      automationId: "auto-001",
    });
  });

  it("provides access to variables parameter", async () => {
    const bundle = makeBundle(`
      return { projectName: variables.projectName };
    `);
    const bundlePath = await writeBundleFile(bundle);

    const result = await runInIsolate(
      makeRunnerConfig(),
      makeExecCtx({ variables: { projectName: "My Project" } }),
      bundlePath
    );

    expect(result.value).toEqual({ projectName: "My Project" });
  });

  it("injects PlaneClient as Plane global", async () => {
    const bundle = makeBundle(`
      var items = await Plane.workItem.list();
      return { items: items };
    `);
    const bundlePath = await writeBundleFile(bundle);

    const result = await runInIsolate(makeRunnerConfig(), makeExecCtx(), bundlePath);

    expect(mockPlaneClient.workItem.list).toHaveBeenCalled();
    expect(result.value).toEqual({ items: [{ id: "wi-1" }] });
  });

  it("injects Functions library and executes user-defined functions", async () => {
    const execCtx = makeExecCtx({
      functions: [
        {
          id: "fn-1",
          name: "greet",
          description: "Returns a greeting",
          category: "utility",
          parameters: [{ name: "name", type: "string", description: "Name to greet", required: true }],
          return_type: "string",
          code: `function greet({ name }) { return "Hello, " + name + "!"; }`,
          usage_example: 'Functions.greet({ name: "World" })',
          is_system: false,
        },
      ],
    });

    const bundle = makeBundle(`
      var greeting = Functions.greet({ name: "Plane" });
      return { greeting: greeting };
    `);
    const bundlePath = await writeBundleFile(bundle);

    const result = await runInIsolate(makeRunnerConfig(), execCtx, bundlePath);

    expect(result.value).toEqual({ greeting: "Hello, Plane!" });
  });

  it("injects Plane and workspaceSlug into Functions library", async () => {
    const execCtx = makeExecCtx({
      workspaceSlug: "injected-ws",
      functions: [
        {
          id: "fn-2",
          name: "getContext",
          description: "Returns injected Plane and workspaceSlug",
          category: "data",
          parameters: [],
          return_type: "object",
          code: `function getContext() { return { hasPlane: typeof Plane === "object" && Plane !== null, ws: workspaceSlug }; }`,
          usage_example: "Functions.getContext()",
          is_system: true,
        },
      ],
    });

    const bundle = makeBundle(`
      var ctx = Functions.getContext();
      return ctx;
    `);
    const bundlePath = await writeBundleFile(bundle);

    const result = await runInIsolate(makeRunnerConfig(), execCtx, bundlePath);

    expect(result.value).toEqual({ hasPlane: true, ws: "injected-ws" });
  });

  it("throws on execution timeout", async () => {
    const bundle = makeBundle(`
      await new Promise(function(resolve) { /* never resolves */ });
    `);
    const bundlePath = await writeBundleFile(bundle);

    await expect(runInIsolate(makeRunnerConfig(), makeExecCtx(), bundlePath)).rejects.toThrow(/timed out/i);
  }, 10_000);

  it("blocks fetch to disallowed domains", async () => {
    const bundle = makeBundle(`
      await fetch("https://blocked.com/data");
    `);
    const bundlePath = await writeBundleFile(bundle);

    await expect(runInIsolate(makeRunnerConfig(), makeExecCtx(), bundlePath)).rejects.toThrow(/Domain not allowed/);
  });

  it("allows fetch to permitted domains", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));

    try {
      const bundle = makeBundle(`
        var res = await fetch("https://api.example.com/data");
        var body = await res.json();
        return body;
      `);
      const bundlePath = await writeBundleFile(bundle);

      const result = await runInIsolate(makeRunnerConfig(), makeExecCtx(), bundlePath);

      expect(globalThis.fetch).toHaveBeenCalledWith("https://api.example.com/data", {});
      expect(result.value).toEqual({ ok: true });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("exposes ENV variables in the sandbox", async () => {
    const bundle = makeBundle(`
      return { myVar: ENV.MY_VAR };
    `);
    const bundlePath = await writeBundleFile(bundle);

    const result = await runInIsolate(makeRunnerConfig(), makeExecCtx(), bundlePath);

    expect(result.value).toEqual({ myVar: "hello" });
  });

  it("throws when bundle does not define main", async () => {
    const bundlePath = await writeBundleFile(`var x = 1;`);

    await expect(runInIsolate(makeRunnerConfig(), makeExecCtx(), bundlePath)).rejects.toThrow(/main is not a function/);
  });
});
