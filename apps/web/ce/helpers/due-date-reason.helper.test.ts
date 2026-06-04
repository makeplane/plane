/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { dueDateChangeRequiresReason } from "./due-date-reason.helper";

describe("dueDateChangeRequiresReason", () => {
  const A = "2026-06-10";
  const B = "2026-06-20";

  it("requires a reason when an existing due date is changed to a different date (edit mode)", () => {
    expect(dueDateChangeRequiresReason(A, B, true)).toBe(true);
  });

  it("does not require a reason during create (not edit mode)", () => {
    expect(dueDateChangeRequiresReason(null, B, false)).toBe(false);
    expect(dueDateChangeRequiresReason(A, B, false)).toBe(false);
  });

  it("does not require a reason on first set (no original date)", () => {
    expect(dueDateChangeRequiresReason(null, B, true)).toBe(false);
    expect(dueDateChangeRequiresReason(undefined, B, true)).toBe(false);
  });

  it("does not require a reason when clearing the date", () => {
    expect(dueDateChangeRequiresReason(A, null, true)).toBe(false);
    expect(dueDateChangeRequiresReason(A, undefined, true)).toBe(false);
  });

  it("does not require a reason when the date is unchanged (reverted to original)", () => {
    expect(dueDateChangeRequiresReason(A, A, true)).toBe(false);
  });
});
