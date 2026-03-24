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

/* oxlint-disable @typescript-eslint/no-unsafe-call */
/* oxlint-disable @typescript-eslint/no-unsafe-member-access */
/* oxlint-disable @typescript-eslint/no-unsafe-assignment */
/* oxlint-disable @typescript-eslint/no-unsafe-argument */
/* oxlint-disable @typescript-eslint/no-unused-vars */
/* oxlint-disable @typescript-eslint/no-explicit-any */
import * as vm from "vm";
import { promises as fs } from "fs";
import { logger } from "@plane/logger";
import type { RunnerConfig } from "./config";
import type { ExecutionContext, ScriptFunction } from './types';
import { ERunnerScriptType } from '@plane/types';
import { serverConfig } from "./env";

// Import PlaneClient to inject into VM context
// Note: Type errors will resolve after running: pnpm install
import * as planeSDK from "@makeplane/plane-node-sdk";
const PlaneClient = (planeSDK as any).PlaneClient || (planeSDK as any).default || planeSDK;

export interface ExecutionResult {
  value: unknown;
}

/**
 * Build a Functions library object from function definitions.
 * Each function is wrapped to be callable with a single params object.
 */
function buildFunctionsLibrary(
  functions: ScriptFunction[],
  sandboxedFetch: (url: string, options?: any) => Promise<Response>,
  planeClient: any,
  workspaceSlug: string
): Record<string, (...args: any[]) => any> {
  const library: Record<string, (...args: any[]) => any> = {};

  for (const fn of functions) {
    try {
      // Create a factory function that:
      // 1. Takes 'fetch', 'Plane', and 'workspaceSlug' as parameters
      // 2. Defines the function from the code
      // 3. Returns the named function
      // The code defines functions like: async function httpRequest({ url, ... }) { ... }
      // oxlint-disable-next-line @typescript-eslint/no-implied-eval
      const factory = new Function("fetch", "Plane", "workspaceSlug", `${fn.code}\nreturn ${fn.name};`);

      // Call the factory with injected dependencies to get the actual function
      const executableFn = factory(sandboxedFetch, planeClient, workspaceSlug);

      if (typeof executableFn !== "function") {
        throw new Error(`${fn.name} is not a function after evaluation`);
      }

      library[fn.name] = executableFn;
    } catch (err: any) {
      logger.error(`[runner-error] Failed to load function ${fn.name}:`, { error: err.message });
      // Provide a stub that throws an error
      library[fn.name] = () => {
        throw new Error(`Function ${fn.name} failed to load: ${err.message}`);
      };
    }
  }

  return library;
}

export async function runInIsolate(
  cfg: RunnerConfig,
  execCtx: ExecutionContext,
  bundlePath: string,
  sourcemapPath?: string | null
): Promise<ExecutionResult> {
  const bundleCode = await fs.readFile(bundlePath, "utf8");

  // Create sandboxed fetch that respects allowed domains
  const sandboxedFetch = async (rawUrl: string, options: any = {}) => {
    const url = new URL(rawUrl);
    const allowed = execCtx.allowedDomains.some((d) => url.hostname.endsWith(d));
    if (!allowed) {
      throw new Error(`Domain not allowed: ${url.hostname}`);
    }
    return fetch(rawUrl, options);
  };

  // Initialize PlaneClient instance on the server and inject into context
  const planeClientInstance = new PlaneClient({
    accessToken: execCtx.accessToken,
    baseUrl: execCtx.baseUrl,
  });

  // Build Functions library from available functions
  const functionsLibrary = buildFunctionsLibrary(
    execCtx.functions || [],
    sandboxedFetch,
    planeClientInstance,
    execCtx.workspaceSlug
  );

  // Create hardened context - SECURITY: Only expose safe APIs
  // Removed: require (allows fs, net, child_process access)
  // Removed: Buffer (can be used for memory attacks)
  // Removed: process.nextTick, process.exit, etc. (dangerous operations)
  const context = vm.createContext({
    // Safe console wrapper
    console: {
      log: (...args: any[]) => logger.info("[runner-log]", { executionId: cfg.executionId, args }),
      error: (...args: any[]) => logger.error("[runner-error]", { executionId: cfg.executionId, args }),
      warn: (...args: any[]) => logger.warn("[runner-warn]", { executionId: cfg.executionId, args }),
      info: (...args: any[]) => logger.info("[runner-info]", { executionId: cfg.executionId, args }),
      debug: (...args: any[]) => logger.debug("[runner-debug]", { executionId: cfg.executionId, args }),
    },
    // Safe standard globals
    JSON: JSON,
    Math: Math,
    Date: Date,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    RegExp: RegExp,
    Error: Error,
    TypeError: TypeError,
    RangeError: RangeError,
    Map: Map,
    Set: Set,
    WeakMap: WeakMap,
    WeakSet: WeakSet,
    Promise: Promise,
    Symbol: Symbol,
    Proxy: Proxy,
    Reflect: Reflect,
    // URL utilities
    URL: URL,
    URLSearchParams: URLSearchParams,
    // Encoding/decoding
    atob: atob,
    btoa: btoa,
    encodeURI: encodeURI,
    encodeURIComponent: encodeURIComponent,
    decodeURI: decodeURI,
    decodeURIComponent: decodeURIComponent,
    // Timers (safe to expose)
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    // TextEncoder/TextDecoder for string handling
    TextEncoder: TextEncoder,
    TextDecoder: TextDecoder,
    // Global references
    global: {},
    globalThis: {},
    // Custom Plane globals
    ENV: execCtx.env,
    variables: execCtx.variables,
    __PLANE_EVENT: execCtx.event,
    __PLANE_VARIABLES: execCtx.variables,
    __PLANE_CONFIG: {
      apiKey: execCtx.accessToken,
      baseUrl: execCtx.baseUrl,
    },
    workspaceSlug: execCtx.workspaceSlug,
    // Injected PlaneClient instance (pre-initialized on server)
    Plane: planeClientInstance,
    // Sandboxed fetch
    fetch: sandboxedFetch,
    // Functions library - reusable function helpers
    Functions: functionsLibrary,
  });

  // Set globalThis reference
  context.globalThis = context;
  context.global = context;

  // 1) Run bundle.js (defines globalThis.main and includes SDK)
  const script = new vm.Script(bundleCode, {
    filename: "bundle.js",
  });

  try {
    script.runInContext(context, { timeout: 1000 });
  } catch (err: any) {
    throw new Error("Error during script initialization: " + err.message);
  }

  // 2) Call main(__PLANE_EVENT, Plane, ENV) with async timeout
  try {
    if (typeof context.main !== "function" && typeof context.globalThis?.main !== "function") {
      throw new Error("globalThis.main is not a function");
    }

    const mainFn = context.main || context.globalThis.main;
    const timeoutMs = serverConfig.timeoutMs;

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`Execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Execute main with timeout - Promise.race will reject if timeout fires first
    // mainFn depends on the eventType to take input and variables as arguments
    let functionPromise: Promise<unknown>;
    if (execCtx.eventType === ERunnerScriptType.CRON_TRIGGER) {
      functionPromise = mainFn(context.__PLANE_VARIABLES);
    } else if (
      execCtx.eventType === ERunnerScriptType.AUTOMATION ||
      execCtx.eventType === ERunnerScriptType.WORKFLOW_TRANSITION
    ) {
      functionPromise = mainFn(context.__PLANE_EVENT, context.__PLANE_VARIABLES);
    } else {
      throw new Error(`Unsupported runner script type: ${execCtx.eventType}`);
    }
    // execute the function with timeout
    const result = await Promise.race([functionPromise, timeoutPromise]);

    return { value: result };
  } catch (err: any) {
    throw new Error(err?.message || "Unknown error during execution");
  }
}
