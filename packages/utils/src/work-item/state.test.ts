/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import type { TDraggableData } from "@plane/constants";
import type { IState } from "@plane/types";
import { getCurrentStateSequence } from "./state";

const sequence = (values: number[], target: number, edge: string | undefined) =>
  getCurrentStateSequence(
    values.map((value, index) => ({ id: String(index), sequence: value }) as IState),
    { id: String(target) } as TDraggableData,
    edge
  );

describe("getCurrentStateSequence", () => {
  it.each([
    [[0, 65535], 0, "top", -65535],
    [[0, 65535], 0, "bottom", 32767.5],
    [[0], 0, "bottom", 65535],
    [[-65535, 0, 65535], 1, "top", -32767.5],
    [[-65535, 0, 65535], 1, "bottom", 32767.5],
    [[-100, 0, 100], 2, "top", 50],
    [[-100, 0, 100], 0, "bottom", -50],
    [[65535, 131070], 0, "bottom", 98302.5],
    [[65535], 0, "top", 0],
    [[65535], 0, "bottom", 131070],
  ])("positions %j at %i %s with sequence %s", (values, target, edge, expected) => {
    expect(sequence(values, target, edge)).toBe(expected);
  });

  it("preserves default fallback when edge or destination is missing", () => {
    expect(sequence([0], 0, undefined)).toBe(65535);
    expect(sequence([0], 4, "top")).toBe(65535);
    expect(sequence([], 0, "bottom")).toBe(65535);
  });
});
