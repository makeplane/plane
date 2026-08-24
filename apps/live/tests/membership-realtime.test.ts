/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { getMembershipRealtimeChannel, shouldForwardMembershipEventToUser } from "@/utils/membership-realtime";

describe("membership realtime helpers", () => {
  it("builds a per-user redis channel", () => {
    expect(getMembershipRealtimeChannel("user-1")).toBe("plane:membership:user-1");
  });

  it("only forwards events to the removed user", () => {
    expect(
      shouldForwardMembershipEventToUser({
        eventUserId: "user-1",
        socketUserId: "user-1",
      })
    ).toBe(true);
    expect(
      shouldForwardMembershipEventToUser({
        eventUserId: "user-1",
        socketUserId: "user-2",
      })
    ).toBe(false);
  });
});
