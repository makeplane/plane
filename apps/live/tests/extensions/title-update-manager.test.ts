/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

const { mockGetPageService, mockUpdatePageProperties } = vi.hoisted(() => ({
  mockGetPageService: vi.fn(),
  mockUpdatePageProperties: vi.fn(),
}));

vi.mock("@/services/page/handler", () => ({ getPageService: mockGetPageService }));
vi.mock("@plane/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

import { TitleUpdateManager } from "@/extensions/title-update/title-update-manager";
import type { HocusPocusServerContext } from "@/types";

const contextFor = (userId: string) =>
  ({ documentType: "project_page", userId, cookie: `session=${userId}` }) as HocusPocusServerContext;

afterEach(() => vi.useRealTimers());

describe("TitleUpdateManager", () => {
  it("saves the debounced title with the context of the latest change", async () => {
    vi.useFakeTimers();
    mockGetPageService.mockReturnValue({ updatePageProperties: mockUpdatePageProperties });
    mockUpdatePageProperties.mockResolvedValue({});
    const manager = new TitleUpdateManager("doc-1", 100);
    const second = contextFor("u2");

    manager.scheduleUpdate("First", contextFor("u1"));
    manager.scheduleUpdate("Second", second);
    await vi.advanceTimersByTimeAsync(100);

    expect(mockGetPageService).toHaveBeenCalledTimes(1);
    expect(mockGetPageService).toHaveBeenCalledWith("project_page", second);
    expect((mockUpdatePageProperties.mock.calls[0] as [string, { data: unknown }])[1].data).toEqual({ name: "Second" });
  });

  it("saves with the latest change's context when the document unloads before the debounce fires", async () => {
    vi.useFakeTimers();
    mockGetPageService.mockClear().mockReturnValue({ updatePageProperties: mockUpdatePageProperties });
    mockUpdatePageProperties.mockClear().mockResolvedValue({});
    const manager = new TitleUpdateManager("doc-2", 5000);
    const second = contextFor("u2");

    manager.scheduleUpdate("First", contextFor("u1"));
    manager.scheduleUpdate("Second", second);
    await manager.forceSave();

    expect(mockGetPageService).toHaveBeenCalledTimes(1);
    expect(mockGetPageService).toHaveBeenCalledWith("project_page", second);

    // The flushed save is not repeated when the timer would have fired.
    await vi.advanceTimersByTimeAsync(5000);
    expect(mockGetPageService).toHaveBeenCalledTimes(1);
  });
});
