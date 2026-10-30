/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmptyStateCompact } from "../compact-empty-state";
import { EmptyStateDetailed } from "../detailed-empty-state";
import type { HorizontalStackAssetType, VerticalStackAssetType } from "./asset-types";

const COMPACT_KEYS = [
  "activity",
  "archive",
  "comment",
  "widget",
] as const satisfies readonly HorizontalStackAssetType[];
const DETAILED_KEYS = ["archive"] as const satisfies readonly VerticalStackAssetType[];

const findIllustration = async (container: HTMLElement) => {
  await waitFor(() => expect(container.querySelector("svg")).not.toBeNull());
  return container.querySelector("svg") as SVGSVGElement;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("empty-state activity, archive, comment and widget illustrations", () => {
  for (const assetKey of COMPACT_KEYS) {
    it(`renders the compact "${assetKey}" illustration as decorative art`, async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const { container } = render(
        <EmptyStateCompact assetKey={assetKey} assetClassName="asset-size" title="Nothing here yet" />
      );
      const svg = await findIllustration(container);
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      expect(svg.getAttribute("class")).toBe("asset-size");
      expect(screen.getByText("Nothing here yet")).toBeDefined();
      expect(warn).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    });
  }

  for (const assetKey of DETAILED_KEYS) {
    it(`renders the detailed "${assetKey}" illustration as decorative art`, async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const { container } = render(<EmptyStateDetailed assetKey={assetKey} title="No archived items" />);
      const svg = await findIllustration(container);
      expect(svg.getAttribute("aria-hidden")).toBe("true");
      expect(screen.getByRole("heading", { name: "No archived items" })).toBeDefined();
      expect(warn).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    });
  }
});
