/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { existsSync } from "node:fs";

import { ADAPTER_BINS } from "@plane/acp-adapters";
import { describe, expect, it } from "vitest";

import { ADAPTER_BIN_NAMES, adapterBinPaths, createAdapterResolver } from "../src/bins.ts";

describe("adapter bins", () => {
  it("mirrors ADAPTER_BINS from @plane/acp-adapters", () => {
    expect(ADAPTER_BIN_NAMES).toEqual(ADAPTER_BINS);
  });

  it("resolves every adapter to an installed bin run with node", () => {
    const paths = adapterBinPaths();
    for (const file of Object.values(paths)) expect(existsSync(file), file).toBe(true);
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
});
