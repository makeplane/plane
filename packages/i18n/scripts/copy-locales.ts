/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * The bundled dist/index.js loads namespaces via a runtime-relative
 * `import("../locales/<lang>/<ns>.json")`, which resolves to a `locales/`
 * folder at the package root — not `src/locales/` where the sources live.
 * This script mirrors src/locales to the package root after each build so
 * consumers (Vite dev and build alike) can resolve the dynamic import.
 */
import { cpSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(packageRoot, "src", "locales");
const target = path.join(packageRoot, "locales");

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
console.log(`Copied locales -> ${target}`);
