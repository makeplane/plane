/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { ChevronDownOutline } from "@makeplane/propel/icons";
import type { IconElement } from "../types";
import { cn } from "@plane/utils";
import { SelectContext } from "./context";
import type { SelectChromeSize } from "./types";

export type SelectContentProps = {
  size?: SelectChromeSize;
  prependIcon?: IconElement | null;
  appendIcon?: IconElement | null;
  variant?: "select" | "select-ghost";
  /**
   * Whether to wear the placeholder treatment. Defaults to "nothing is selected" from the enclosing
   * `Select`; pass it explicitly for triggers with no `Select` around them (e.g. the date blocks).
   */
  isEmpty?: boolean;
  children?: React.ReactNode;
};

export function SelectContent(props: SelectContentProps) {
  const {
    prependIcon = null,
    appendIcon = <ChevronDownOutline aria-hidden="true" />,
    variant = "select",
    size = "lg",
    children,
  } = props;
  // Read the context directly rather than through `useSelectContext`: outside a `Select` there is
  // none, and `isEmpty` is then the caller's to supply.
  const ctx = React.useContext(SelectContext);
  const isEmpty = props.isEmpty ?? (ctx ? ctx.selected.length === 0 : false);
  const isGhost = variant === "select-ghost";
  // Glyphs follow propel's control scale: 16px up to `xl`, 20px at `2xl` (`--control-glyph-*`).
  const iconClassName = cn("shrink-0", size === "2xl" ? "size-5" : "size-4");

  return (
    // `contents` keeps prepend/children/append as direct flex items of the trigger button (so a
    // `grow` label span still works) while still letting `text-placeholder` cascade to them.
    <span className={cn("contents", isEmpty && "text-placeholder group-disabled:text-disabled")}>
      {prependIcon &&
        React.cloneElement(prependIcon, {
          className: cn(iconClassName, isEmpty && "text-placeholder group-disabled:text-disabled"),
        })}
      {children}
      {appendIcon &&
        React.cloneElement(appendIcon, {
          className: cn(
            iconClassName,
            isEmpty && "text-placeholder group-disabled:text-disabled",
            isGhost && "invisible group-hover:visible group-focus-visible:visible group-active:visible"
          ),
        })}
    </span>
  );
}
