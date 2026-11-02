/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectSelect } from "./project-select";

describe("ProjectSelect pill composition", () => {
  it("keeps the project logo stack and count as sibling flex items", () => {
    render(
      <ProjectSelect
        multiple
        getValues={() => Promise.resolve({ results: [] })}
        value={[
          { id: "alpha", name: "Alpha" },
          { id: "beta", name: "Beta" },
        ]}
        onChange={vi.fn()}
        variant="pill-sm"
      />
    );

    const button = screen.getByRole("button", { name: "Alpha, Beta" });
    const count = within(button).getByText("2 projects");
    const stack = button.firstElementChild;
    expect(count.parentElement).toBe(button);
    expect(stack?.querySelectorAll("svg")).toHaveLength(2);
    expect(stack?.classList.contains("flex")).toBe(true);
    expect(button.classList.contains("inline-flex")).toBe(true);
  });
});
