/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { getWorkItemRealtimeChannel, shouldForwardWorkItemEventToUser } from "@/utils/work-item-realtime";

describe("work item realtime helpers", () => {
  it("builds a per-project redis channel", () => {
    expect(getWorkItemRealtimeChannel("abc")).toBe("plane:work-items:abc");
  });

  it("does not echo events back to the actor", () => {
    expect(
      shouldForwardWorkItemEventToUser({
        actorId: "user-1",
        userId: "user-1",
        isGuest: false,
        guestCanViewAllWorkItems: false,
      })
    ).toBe(false);
  });

  it("forwards other members' events", () => {
    expect(
      shouldForwardWorkItemEventToUser({
        actorId: "user-1",
        userId: "user-2",
        createdBy: "user-1",
        isGuest: false,
        guestCanViewAllWorkItems: false,
      })
    ).toBe(true);
  });

  it("hides other people's work items from guests without full access", () => {
    expect(
      shouldForwardWorkItemEventToUser({
        actorId: "user-1",
        userId: "guest-1",
        createdBy: "user-1",
        isGuest: true,
        guestCanViewAllWorkItems: false,
      })
    ).toBe(false);
  });

  it("lets guests see work items they created", () => {
    expect(
      shouldForwardWorkItemEventToUser({
        actorId: "user-1",
        userId: "guest-1",
        createdBy: "guest-1",
        isGuest: true,
        guestCanViewAllWorkItems: false,
      })
    ).toBe(true);
  });
});
