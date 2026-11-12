/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { getRenderableItems, resolveItemVariant } from "./helpers";
import type { TContextMenuItem } from "./types";

const noop = () => {};

function item(overrides: Partial<TContextMenuItem> & Pick<TContextMenuItem, "key">): TContextMenuItem {
  return { action: noop, ...overrides };
}

describe("getRenderableItems", () => {
  it("drops only the rows whose shouldRender is explicitly false", () => {
    const items = [
      item({ key: "implicit" }),
      item({ key: "shown", shouldRender: true }),
      item({ key: "hidden", shouldRender: false }),
    ];
    expect(getRenderableItems(items).map((row) => row.key)).toEqual(["implicit", "shown"]);
  });

  it("keeps the caller's order", () => {
    const items = [item({ key: "c" }), item({ key: "a", shouldRender: false }), item({ key: "b" })];
    expect(getRenderableItems(items).map((row) => row.key)).toEqual(["c", "b"]);
  });

  it("returns an empty list for a missing or fully hidden list", () => {
    expect(getRenderableItems(undefined)).toEqual([]);
    expect(getRenderableItems([])).toEqual([]);
    expect(getRenderableItems([item({ key: "hidden", shouldRender: false })])).toEqual([]);
  });

  it("does not filter nested rows — each level is filtered where it renders", () => {
    const nested = [item({ key: "nested-hidden", shouldRender: false })];
    const [parent] = getRenderableItems([item({ key: "parent", nestedMenuItems: nested })]);
    expect(parent.nestedMenuItems).toBe(nested);
  });
});

describe("resolveItemVariant", () => {
  it("defaults to neutral", () => {
    expect(resolveItemVariant(item({ key: "plain" }))).toBe("neutral");
  });

  it("returns an explicit variant as-is", () => {
    expect(resolveItemVariant(item({ key: "danger", variant: "danger" }))).toBe("danger");
    expect(resolveItemVariant(item({ key: "accent", variant: "accent" }))).toBe("accent");
    expect(resolveItemVariant(item({ key: "neutral", variant: "neutral" }))).toBe("neutral");
  });

  it("maps a legacy className carrying a text-danger token to danger", () => {
    expect(resolveItemVariant(item({ key: "legacy", className: "text-danger-primary" }))).toBe("danger");
    expect(resolveItemVariant(item({ key: "legacy-mixed", className: "items-start text-danger" }))).toBe("danger");
  });

  it("ignores every other legacy class", () => {
    expect(resolveItemVariant(item({ key: "layout", className: "items-start" }))).toBe("neutral");
    expect(resolveItemVariant(item({ key: "accent-class", className: "text-accent-primary" }))).toBe("neutral");
  });

  it("lets an explicit variant win over the legacy className", () => {
    expect(resolveItemVariant(item({ key: "both", variant: "neutral", className: "text-danger-primary" }))).toBe(
      "neutral"
    );
    expect(resolveItemVariant(item({ key: "both-accent", variant: "accent", className: "text-danger" }))).toBe(
      "accent"
    );
  });
});
