/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { existsSync } from "node:fs";

import { ADAPTER_BINS } from "@plane/acp-adapters";
import { describe, expect, it } from "vitest";

import {
  ADAPTER_BIN_NAMES,
  LOGIN_ADAPTERS,
  adapterBinPaths,
  createAdapterResolver,
  defaultHelperCommand,
  loginBinPath,
} from "../src/bins.ts";

describe("adapter bins", () => {
  it("mirrors ADAPTER_BINS from @plane/acp-adapters", () => {
    expect(ADAPTER_BIN_NAMES).toEqual(ADAPTER_BINS);
  });

  it("resolves every adapter to an installed bin run with node", () => {
    const paths = adapterBinPaths();
    for (const [adapter, file] of Object.entries(paths)) expect(file && existsSync(file), adapter).toBe(true);
    const { resolve, missing } = createAdapterResolver({ enableEcho: true });
    expect(missing).toEqual([]);
    expect(resolve("codex")).toEqual({ adapter: "codex", command: process.execPath, args: [paths.codex] });
  });

  it("never resolves anything outside the fixed mapping", () => {
    const { resolve } = createAdapterResolver({ enableEcho: false });
    for (const adapter of ["echo", "bash", "../claude", "constructor", "__proto__", "toString", ""]) {
      expect(resolve(adapter), adapter).toBeUndefined();
    }
    expect(resolve("claude")?.adapter).toBe("claude");
  });

  it("refuses an adapter the installed package does not declare", () => {
    const { resolve, missing } = createAdapterResolver({
      enableEcho: true,
      binPaths: { ...adapterBinPaths(), gemini: undefined },
    });
    expect(resolve("gemini")).toBeUndefined();
    expect(missing).toContain("gemini");
  });

  it("finds the sign-in helper, for adapters that have a bin", () => {
    const file = loginBinPath();
    expect(file && existsSync(file), String(file)).toBe(true);
    expect(defaultHelperCommand()).toEqual({ command: process.execPath, args: [file] });
    expect(defaultHelperCommand("/nonexistent/login.mjs")).toBeUndefined();
    for (const adapter of LOGIN_ADAPTERS) expect(Object.keys(ADAPTER_BIN_NAMES)).toContain(adapter);
  });
});
