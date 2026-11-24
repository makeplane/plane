/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MenuSearchInput } from "./menu-search-input";

describe("MenuSearchInput", () => {
  it("is named by an explicit label, not only its placeholder", () => {
    render(<MenuSearchInput value="" onChange={vi.fn()} placeholder="Search states" />);
    expect(screen.getByRole("textbox", { name: "Search states" }).getAttribute("aria-label")).toBe("Search states");
  });

  it("prefers a separate accessible name when given", () => {
    render(<MenuSearchInput value="" onChange={vi.fn()} placeholder="Type to search" aria-label="Search labels" />);
    expect(screen.getByRole("textbox", { name: "Search labels" })).toBeDefined();
  });
});
