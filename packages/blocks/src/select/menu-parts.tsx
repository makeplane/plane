/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { cloneElement } from "react";
import type { ComponentProps, CSSProperties, ReactElement } from "react";
import { ComboboxItem, ComboboxPopup } from "@makeplane/propel/elements/combobox";
import { cn } from "@plane/utils";

/**
 * Propel's `elements` take no `className`; a caller's classes ride on the element they render as.
 *
 * `style` merges rather than replaces: a Base UI host grafted in through `render` can carry its own
 * inline style — `Popover.Popup` passes `transition: none` while its mount transition is `starting`,
 * which is what stops the panel animating out of `data-starting-style` — and replacing it flickers.
 */
const graft = (
  target: ReactElement<{ className?: string; style?: CSSProperties }>,
  className: string | undefined,
  style?: CSSProperties,
  props?: object
) =>
  cloneElement(target, {
    className: cn(target.props.className, className),
    style: { ...target.props.style, ...style },
    ...props,
  });

type TMenuPanelProps = Omit<ComponentProps<typeof ComboboxPopup>, "elevation" | "render"> & {
  className?: string;
  /**
   * Drops the panel's own inset, for a panel whose contents bring their own padding. Inline rather
   * than a `p-0` class: propel applies `p-1` inside the component, where a class cannot outrank it.
   */
  flush?: boolean;
  /** The element the panel renders as. Defaults to a `<div>`. */
  render?: ReactElement<{ className?: string }>;
};

/**
 * The card propel's ready-made panels wear (`ComboboxContent`, `MenuContent`, `MenuSubmenuContent`
 * all render an `OverlayPanel`), so a panel of ours sits beside one without changing surface. The
 * `raised` popup below is propel's other surface — `layer-1`/`overlay-100` — which is right only
 * when the popup is the outer chrome. Tokens rather than an import: `OverlayPanel` is internal.
 */
const OVERLAY_CARD_STYLE = {
  backgroundColor: "var(--bg-layer-2)",
  boxShadow: "var(--shadow-overlay-200)",
} satisfies CSSProperties;

/**
 * The floating surface a menu, flyout or option list sits on.
 *
 * Graft it onto a Base UI popup with `render` (`<Combobox.Popup render={<MenuPanel />} />`) so the
 * popup's behaviour and the `data-prevent-outside-click` marker stay on the real element.
 */
export function MenuPanel({ className, flush, render, ...props }: TMenuPanelProps) {
  const target = render ?? <div />;
  return (
    <ComboboxPopup
      elevation="raised"
      render={graft(target, className, { ...OVERLAY_CARD_STYLE, ...(flush ? { padding: 0 } : null) })}
      {...props}
    />
  );
}

type TMenuRowProps = Omit<ComponentProps<typeof ComboboxItem>, "variant" | "render"> & {
  className?: string;
  /**
   * Sets `data-disabled` (propel's row chrome dims it and drops pointer events) and `aria-disabled`.
   * The native `disabled` belongs on the element passed as `render`, since only a real control can
   * carry it — that is why the button callers set it there too.
   */
  disabled?: boolean;
  /**
   * Marks the row active when its host tracks that itself — a flyout trigger whose submenu is open.
   * A Base UI host sets `data-highlighted` on its own and needs nothing here.
   */
  highlighted?: boolean;
  /** The element the row renders as. Defaults to a `<div>`; a standalone row passes a `<button>`. */
  render?: ReactElement<{ className?: string }>;
};

/**
 * One row of a menu or option list — propel's combobox item chrome.
 *
 * Propel fills the row off `data-highlighted`, which only a Base UI host sets, so a plain row gets
 * a pointer fill here. `justify-between` is for callers that push trailing content to the inline end.
 */
export function MenuRow({ className, disabled, highlighted, render, ...props }: TMenuRowProps) {
  return (
    <ComboboxItem
      variant="neutral"
      render={graft(render ?? <div />, cn("justify-between hover:bg-layer-transparent-hover", className), undefined, {
        "data-highlighted": highlighted ? "" : undefined,
        "data-disabled": disabled ? "" : undefined,
        "aria-disabled": disabled || undefined,
      })}
      {...props}
    />
  );
}
