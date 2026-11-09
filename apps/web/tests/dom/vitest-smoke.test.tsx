/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

function SmokeBanner() {
  return <h1>board tests dom smoke</h1>;
}

describe("vitest dom project smoke test", () => {
  it("renders with testing-library under jsdom and stubs both observers", () => {
    render(<SmokeBanner />);

    expect(screen.getByRole("heading", { name: "board tests dom smoke" }).textContent).toBe("board tests dom smoke");
    expect(globalThis.ResizeObserver).toBeDefined();
    expect(globalThis.IntersectionObserver).toBeDefined();
  });
});
