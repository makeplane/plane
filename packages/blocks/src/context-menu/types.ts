/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type * as React from "react";

/** Row look, shared by the context-menu and dropdown renderings of a `TContextMenuItem`. */
export type TContextMenuItemVariant = "neutral" | "accent" | "danger";

/**
 * One row of a context menu, or of a quick-actions list rendered as a menu elsewhere. Kept
 * shape-compatible with `@plane/ui`'s `TContextMenuItem` so the ~60 files that build these arrays
 * migrate with an import change alone.
 */
export type TContextMenuItem = {
  /** Stable identity for the row. */
  key: string;
  /**
   * Arbitrary content rendered in place of the row's icon + label pair. Rendered in the row's
   * leading slot, so pair it with `title` when the row still needs an accessible name.
   */
  customContent?: React.ReactNode;
  /** The row label. */
  title?: string;
  /**
   * Secondary copy, usually the reason a row is disabled. Rendered as a muted second line under the
   * label; a submenu trigger, which has no second line, shows it at its inline end.
   */
  description?: string;
  /**
   * Leading glyph component, e.g. a lucide icon. Deliberately `any`-propped, matching the legacy
   * type: the arrays that feed this mix lucide icons, `ISvgIcons` glyphs and local components.
   *
   * There is no `iconClassName` to go with it. Propel's row sizes and tints its own glyph, so the
   * legacy prop was accepted and ignored through the migration and is gone with its last call site.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: React.FC<any>;
  /** Invoked when the row is pressed. */
  action: () => void;
  /**
   * Row look. `neutral` is the standard text hierarchy, `danger` marks a destructive action, and
   * `accent` marks the primary one. Propel's context-menu row has no `accent` of its own, so a
   * context menu renders it as `neutral`; the same arrays feeding a dropdown get the real thing.
   *
   * @default "neutral"
   */
  variant?: TContextMenuItemVariant;
  /** Set `false` to drop the row entirely. */
  shouldRender?: boolean;
  /** Set `false` to keep the menu open after the row is pressed. @default true */
  closeOnClick?: boolean;
  /** Whether the row ignores interaction. */
  disabled?: boolean;
  /**
   * @deprecated Use `variant` instead — Propel rows take no `className`. Kept so the existing arrays
   * keep compiling, and honoured in one narrow way: a value containing `text-danger` still resolves
   * to `variant: "danger"`, so the ~15 quick-action files that paint their Delete row red keep it
   * until they migrate. Every other class in the string is dropped.
   */
  className?: string;
  /** Rows nested under this one. A non-empty list turns the row into a submenu trigger. */
  nestedMenuItems?: TContextMenuItem[];
};
