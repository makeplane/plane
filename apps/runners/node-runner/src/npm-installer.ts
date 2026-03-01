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

import { spawn } from "child_process";
import { join } from "path";
import { mkdirSync } from "fs";
import { mkdtemp, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { logger } from "@plane/logger";

export async function buildFromSource(sourcePath: string): Promise<string> {
  logger.info(`Building from source at ${sourcePath}...`);

  // 1. npm install
  logger.info("Running npm install...");
  await new Promise<void>((resolve, reject) => {
    const child = spawn("npm", ["install", "--include=dev"], {
      stdio: "inherit",
      cwd: sourcePath,
      env: { ...process.env, NODE_ENV: "development" }, // Ensure dev deps are installed
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm install failed with code ${code}`));
    });
  });

  // 2. npm run build
  await new Promise<void>((resolve, reject) => {
    const child = spawn("npm", ["run", "build"], {
      stdio: "inherit",
      cwd: sourcePath,
      env: process.env,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm run build failed with code ${code}`));
    });
  });

  return join(sourcePath, "dist", "bundle.js");
}

/**
 * Builds a bundle from a code string dynamically.
 * Creates a temporary directory, writes the code and package.json, then builds.
 * @param code - The code string to build
 * @param inlineScript - If true, code is inline and doesn't need main() wrapper. If false, wraps code in export async function main()
 */
export async function buildFromCodeString(code: string, inlineScript: boolean = false): Promise<string> {
  // Create a temporary directory for this execution
  const tempDir = await mkdtemp(join(tmpdir(), "plane-runner-"));
  logger.info(`Building from code string in ${tempDir}...`);

  // Conditionally wrap the code based on inlineScript flag
  // Note: PlaneClient is now injected by the server into the VM context, so no initialization needed here
  const wrappedCode = !inlineScript
    ? code // Inline script - use code as-is
    : `export async function main() {
    ${code}
  }`;
  logger.debug("Wrapped code for build", { wrappedCode });

  // Write index.ts so esbuild handles TypeScript syntax (strips types natively)
  const indexPath = join(tempDir, "index.ts");
  await writeFile(indexPath, wrappedCode, "utf8");

  // Write package.json with esbuild configuration
  // Note: Plane SDK is NOT bundled - it's injected by the server into VM context
  const packageJson = {
    name: "@plane/runner-script-dynamic",
    version: "1.0.0",
    main: "dist/bundle.js",
    scripts: {
      build:
        "./node_modules/.bin/esbuild index.ts --bundle --outfile=dist/bundle.js --platform=node --format=iife --global-name=globalThis",
    },
    dependencies: {},
    devDependencies: {
      esbuild: "^0.19.0",
    },
  };
  const packageJsonPath = join(tempDir, "package.json");
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), "utf8");

  // Create dist directory
  const distDir = join(tempDir, "dist");
  mkdirSync(distDir, { recursive: true });

  // Build using the same logic as buildFromSource
  // 1. npm install
  logger.info("Running npm install...");
  await new Promise<void>((resolve, reject) => {
    const child = spawn("npm", ["install", "--include=dev"], {
      stdio: "inherit",
      cwd: tempDir,
      env: { ...process.env, NODE_ENV: "development" },
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm install failed with code ${code}`));
    });
  });

  // 2. npm run build
  logger.info("Running npm run build...");
  await new Promise<void>((resolve, reject) => {
    const child = spawn("npm", ["run", "build"], {
      stdio: "inherit",
      cwd: tempDir,
      env: process.env,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm run build failed with code ${code}`));
    });
  });

  return join(tempDir, "dist", "bundle.js");
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates TypeScript code using tsc (TypeScript compiler)
 * This performs full type checking, not just syntax validation
 * @param code - The code string to validate
 * @param inlineScript - If true, code is inline and doesn't need main() wrapper. If false, wraps code in export async function main()
 * @returns ValidationResult with valid flag and array of error messages
 */
export async function validateCodeWithTsc(code: string, inlineScript: boolean = false): Promise<ValidationResult> {
  // Create a temporary directory for validation
  const tempDir = await mkdtemp(join(tmpdir(), "plane-validate-"));
  logger.info(`Validating code with tsc in ${tempDir}...`);

  try {
    // Conditionally wrap the code based on inlineScript flag
    const wrappedCode = !inlineScript
      ? code // Inline script - use code as-is
      : `export async function main() {
    ${code}
  }`;

    // Write index.ts with the wrapped code
    const indexPath = join(tempDir, "index.ts");
    await writeFile(indexPath, wrappedCode, "utf8");

    // Write tsconfig.json for validation
    // Using strict mode to catch type errors
    const tsconfig = {
      compilerOptions: {
        target: "ES2020",
        module: "ESNext",
        moduleResolution: "node",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true, // Only check, don't emit files
        resolveJsonModule: true,
        allowSyntheticDefaultImports: true,
      },
      include: ["index.ts"],
    };
    const tsconfigPath = join(tempDir, "tsconfig.json");
    await writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2), "utf8");

    // Install typescript if not available globally
    // We'll try to use npx tsc first, which should work if typescript is installed
    const tscCommand = "npx";
    const tscArgs = ["-y", "typescript@^5.0.0", "--", "tsc", "--noEmit"];

    // Run tsc --noEmit to check for type errors
    const errors: string[] = [];
    await new Promise<void>((resolve, reject) => {
      const child = spawn(tscCommand, tscArgs, {
        cwd: tempDir,
        stdio: ["ignore", "pipe", "pipe"], // Capture stdout and stderr
        env: { ...process.env, NODE_ENV: "development" },
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      child.on("exit", (code) => {
        // tsc returns non-zero exit code if there are errors
        if (code === 0) {
          resolve();
        } else {
          // Parse tsc output to extract error messages
          const output = stdout + stderr;
          // Split by lines and filter out empty lines
          const errorLines = output.split("\n").filter((line) => line.trim().length > 0 && !line.includes("Found"));

          if (errorLines.length > 0) {
            errors.push(...errorLines);
          } else {
            // Fallback: use the entire output if we can't parse it
            errors.push(output || "TypeScript compilation failed");
          }
          resolve(); // Don't reject, we want to return errors
        }
      });

      child.on("error", (err) => {
        reject(new Error(`Failed to run tsc: ${err.message}`));
      });
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (err) {
    // If validation itself fails (e.g., tsc not available), return error
    return {
      valid: false,
      errors: [(err as Error).message || "Validation failed"],
    };
  }
}
