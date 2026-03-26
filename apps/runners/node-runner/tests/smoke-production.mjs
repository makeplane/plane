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

/**
 * Smoke test for production builds.
 *
 * Imports the COMPILED code-validator from dist/ and verifies that
 * TypeScript parsing works end-to-end. This catches ESM/CJS bundling
 * issues (e.g. acorn-typescript not being bundled) that unit tests miss
 * because they run against source with all devDependencies available.
 *
 * Usage:
 *   pnpm build && node tests/smoke-production.mjs
 */

import { validateCodeSecurity } from "../dist/code-validator.mjs";

const cases = [
  {
    name: "TypeScript function with type annotations",
    code: "export async function main(input: AutomationEventInput, variables: Record<string, string>) { return { success: true }; }",
    expectValid: true,
  },
  {
    name: "Generic types",
    code: "const m: Map<string, number> = new Map();",
    expectValid: true,
  },
  {
    name: "As const assertion",
    code: "const x = { a: 1 } as const;",
    expectValid: true,
  },
  {
    name: "Interface declaration",
    code: "interface Foo { bar: string; baz: number; }",
    expectValid: true,
  },
  {
    name: "Satisfies operator",
    code: "const config = {} satisfies Record<string, unknown>;",
    expectValid: true,
  },
  {
    name: "Blocked eval should fail validation",
    code: 'eval("bad");',
    expectValid: false,
  },
];

let passed = 0;
let failed = 0;

for (const t of cases) {
  const result = validateCodeSecurity(t.code);
  if (result.valid === t.expectValid) {
    console.log("  PASS:", t.name);
    passed++;
  } else {
    console.error("  FAIL:", t.name);
    console.error("    expected valid=" + t.expectValid + ", got valid=" + result.valid);
    console.error("    violations:", JSON.stringify(result.violations));
    failed++;
  }
}

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
