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

/* oxlint-disable @typescript-eslint/no-misused-promises */

import * as walk from "acorn-walk";
import express, { Request, Response } from "express";
import { tsParser } from "./ts-parser";
import type { ASTNode } from "./ts-parser";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { logger, loggerMiddleware } from "@plane/logger";
import { buildFromCodeString } from "./npm-installer";
import { runInIsolate } from "./isolate-executor";
import { serverConfig } from "./env";
import { validateCodeSecurity } from "./code-validator";
import type { ScriptFunction, AutomationEventInput } from "./types";

/**
 * Detect function names used in code via Functions.* member expressions.
 * Uses AST parsing with regex fallback for robustness.
 */
function detectFunctionNames(code: string): string[] {
  const functionNames = new Set<string>();

  try {
    const ast = tsParser.parse(code, {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: true,
    });

    walk.simple(ast, {
      MemberExpression(node: ASTNode) {
        const obj = node.object;
        const prop = node.property;

        if (obj?.type === "Identifier" && obj.name === "Functions" && prop?.type === "Identifier" && prop.name) {
          functionNames.add(prop.name);
        }
      },
    });
  } catch {
    // AST parsing failed (e.g., syntax error) - fallback to regex
    const matches = code.matchAll(/Functions\.(\w+)/g);
    for (const match of matches) {
      functionNames.add(match[1]);
    }
  }

  return Array.from(functionNames);
}

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(loggerMiddleware);

// Environment configuration is now loaded from env.ts

/**
 * GET /health
 * Health check endpoint to verify the runner service is running
 * Response: { status: "ok" }
 */
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

/**
 * POST /build
 * Builds code from request body and returns the bundle
 * Request body: { code: string, code_type?: string }
 * Response: { success: boolean, build?: string, sourcemap?: string, function_names?: string[], error?: string }
 */
app.post("/build", async (req: Request, res: Response) => {
  try {
    const { code, code_type, inlineScript } = req.body as {
      code: string;
      code_type?: string;
      inlineScript?: boolean;
    };

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        error: "code is required and must be a string",
      });
    }

    // Validate code security before building
    const validation = validateCodeSecurity(code);
    if (!validation.valid) {
      logger.warn("[build] Security validation failed:", { violations: validation.violations });
      return res.status(400).json({
        success: false,
        error: "Security validation failed",
        violations: validation.violations,
      });
    }

    logger.info("[build] Building code from request...");

    // Detect function names used in the code
    const functionNames = detectFunctionNames(code);
    logger.info("[build] Detected function names:", { functionNames });

    // Support both code_type (from API) and inlineScript (legacy)
    const isInline = code_type === "inline" || inlineScript === true;
    const bundlePath = await buildFromCodeString(code, isInline);
    const bundle = await readFile(bundlePath, "utf8");

    const sourcemapPath = bundlePath.replace(".js", ".js.map");
    let sourcemap: string | null = null;
    if (existsSync(sourcemapPath)) {
      sourcemap = await readFile(sourcemapPath, "utf8");
    }

    logger.info("[build] Build completed successfully");

    res.json({
      success: true,
      build: bundle,
      sourcemap: sourcemap || undefined,
      function_names: functionNames,
    });
  } catch (err) {
    logger.error("[build] Build error:", err);
    res.status(400).json({
      success: false,
      error: (err as Error).message,
    });
  }
});

/**
 * POST /validate
 * Validates code by building it and checking for errors
 * Request body: { code: string, inlineScript?: boolean }
 * Response: { valid: boolean, errors?: string[] }
 */
app.post("/validate", async (req: Request, res: Response) => {
  try {
    const { code, inlineScript } = req.body as { code: string; inlineScript: boolean };

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "code is required and must be a string" });
    }

    logger.info("[validate] Validating code...");

    // First, validate code security
    const validation = validateCodeSecurity(code);
    if (!validation.valid) {
      logger.warn("[validate] Security validation failed:", { violations: validation.violations });
      return res.status(200).json({
        valid: false,
        errors: validation.violations,
      });
    }

    // Build the code to check for compilation errors
    await buildFromCodeString(code, inlineScript ?? false);

    // If build succeeds, code is valid
    res.json({ valid: true });
  } catch (err) {
    logger.error("[validate] Validation error:", err);
    res.status(200).json({
      valid: false,
      errors: [(err as Error).message],
    });
  }
});

/**
 * POST /execute-sync
 * Executes code synchronously and returns result directly
 * Request body: { code: string, build?: string, workspace_slug: string, input_data?: object, code_type?: string, env_variables?: object, allowed_domains?: string[], access_token: string }
 * Response: { status: "completed" | "errored", output_data?: unknown, error_data?: object }
 *
 * If `build` is provided (pre-built bundle), skips the build step for faster execution.
 * Otherwise, builds code from scratch (fallback for test runs or scripts without pre-built bundles).
 */
app.post("/execute-sync", async (req: Request, res: Response) => {
  let tempDir: string | null = null;

  try {
    const {
      code,
      build,
      input_data,
      code_type,
      env_variables,
      execution_variables,
      allowed_domains,
      access_token,
      workspace_slug,
      functions,
    } = req.body as {
      code: string;
      build?: string;
      input_data: AutomationEventInput;
      code_type?: string;
      env_variables?: Record<string, string>;
      execution_variables?: Record<string, string>;
      allowed_domains?: string[];
      access_token: string;
      workspace_slug: string;
      functions?: ScriptFunction[];
    };

    logger.debug("[execute-sync] Request body", {
      code,
      build,
      input_data,
      code_type,
      env_variables,
      execution_variables,
      workspace_slug,
      functions,
    });

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "code is required and must be a string" });
    }

    // Determine if code is inline (no main function wrapper needed)
    const inlineScript = code_type === "inline";

    let bundlePath: string;
    let sourcemapPath: string | null = null;

    if (build) {
      // Use pre-built bundle - write to temp file for executor
      // Note: Pre-built bundles were already validated at build time
      logger.info("[execute-sync] Using pre-built bundle, skipping build step...");
      tempDir = mkdtempSync(join(tmpdir(), "runner-exec-"));
      bundlePath = join(tempDir, "bundle.js");
      writeFileSync(bundlePath, build);
    } else {
      // Fallback: Build from code (for test runs or scripts without pre-built bundles)
      // Validate code security before building
      const validation = validateCodeSecurity(code);
      if (!validation.valid) {
        logger.warn("[execute-sync] Security validation failed:", { violations: validation.violations });
        return res.json({
          status: "errored",
          error_data: {
            message: "Security validation failed",
            violations: validation.violations,
          },
        });
      }

      logger.info("[execute-sync] Building code from scratch...");
      bundlePath = await buildFromCodeString(code, inlineScript);
      sourcemapPath = existsSync(bundlePath.replace(".js", ".js.map")) ? bundlePath.replace(".js", ".js.map") : null;
    }

    // Create minimal execution context
    const execCtx = {
      workspaceSlug: workspace_slug,
      event: input_data,
      env: env_variables || {},
      variables: execution_variables || {},
      allowedDomains: allowed_domains || [],
      code,
      inlineScript,
      accessToken: access_token,
      baseUrl: serverConfig.apiBaseUrl,
      functions: functions || [],
    };

    // Create minimal runner config for logging
    const cfg = {
      workspaceSlug: workspace_slug,
      taskId: "sync",
      executionId: `sync-${Date.now()}`,
    };

    const result = await runInIsolate(cfg, execCtx, bundlePath, sourcemapPath);

    logger.info("[execute-sync] Execution completed successfully");

    res.json({
      status: "completed",
      output_data: result.value,
    });
  } catch (err) {
    res.json({
      status: "errored",
      error_data: {
        message: (err as Error)?.message || "Unknown error",
        stack: (err as Error)?.stack,
      },
    });
  } finally {
    // Clean up temp directory if we created one for pre-built bundle
    if (tempDir) {
      try {
        rmSync(tempDir, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }
});

export function startServer() {
  app.listen(serverConfig.port, () => {
    logger.info(`Plane Runner server listening on port ${serverConfig.port}`);
  });
}
