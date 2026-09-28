/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { expect, it, vi } from "vitest";

it("dispatches scroll events in the element's DOM realm after the global Event changes", () => {
  const element = document.createElement("div");
  const DomEvent = window.Event;
  const onScroll = vi.fn();
  element.addEventListener("scroll", onScroll);

  // A delayed scroll-lock cleanup can run after Vitest restores the host globals.
  // oxlint-disable-next-line typescript/no-extraneous-class -- an intentionally empty stand-in constructor
  vi.stubGlobal("Event", class HostEvent {});
  try {
    element.scrollTop = 24;
    expect(element.scrollTop).toBe(24);
    expect(onScroll).toHaveBeenCalledExactlyOnceWith(expect.any(DomEvent));
  } finally {
    vi.unstubAllGlobals();
  }
});
