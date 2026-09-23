/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Button } from "@makeplane/propel/components/button";
import type { ButtonSize, ButtonVariant as PropelButtonVariant } from "@makeplane/propel/components/button";
import type { ActionButton, ButtonVariant } from "./types";

/**
 * propel: `@plane/propel/button` is gone (Ruling 25). `EmptyState`'s public `ActionButton` keeps
 * the legacy variant names so its ~150 call sites are untouched; this adapter is the single place
 * that maps them — and the legacy `prependIcon`/`appendIcon` pair — onto the ready-made Propel
 * `Button`. It disappears when Phase 3 migrates `EmptyState` itself.
 *
 * `link` maps to `tertiary`: Propel's link-looking control is `AnchorButton`, which is a different
 * component rather than a `Button` variant, and an empty-state action is a button (it carries
 * `onClick`, not `href`), so the closest chrome is the low-emphasis filled `tertiary`.
 */
const VARIANT_MAP: Record<ButtonVariant, PropelButtonVariant> = {
  primary: "primary",
  secondary: "secondary",
  tertiary: "tertiary",
  ghost: "ghost",
  "error-fill": "danger",
  "error-outline": "danger-outline",
  "primary-outline": "secondary",
  "success-outline": "secondary",
  link: "tertiary",
};

// Safely detects a non-production build without requiring @types/node — same idiom as
// `combobox.tsx` and `@plane/blocks`' toast manager.
const __DEV__ = (() => {
  const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process;
  return proc ? proc.env?.NODE_ENV !== "production" : false;
})();

type EmptyStateActionButtonProps = {
  action: ActionButton;
  size: ButtonSize;
};

export function EmptyStateActionButton({ action, size }: EmptyStateActionButtonProps) {
  const {
    label,
    variant = "primary",
    prependIcon,
    appendIcon,
    loading,
    // Propel components accept neither, and `ActionButton` extends the native button props, so a
    // caller could still pass them. Strip them here rather than letting them reach `Button`.
    className: _className,
    style: _style,
    ...rest
  } = action;

  // Propel's `Button` has one icon slot, so a call site asking for both loses the trailing one.
  // Surface it instead of dropping it silently — there are no such call sites today.
  if (prependIcon && appendIcon && __DEV__) {
    console.warn(
      `[EmptyState] Action "${label}" sets both prependIcon and appendIcon. Propel's Button has a ` +
        `single icon slot, so appendIcon is ignored. Split it into two actions.`
    );
  }

  return (
    <Button
      variant={VARIANT_MAP[variant]}
      size={size}
      stretch="auto"
      icon={prependIcon ?? appendIcon}
      iconPosition={prependIcon ? "start" : "end"}
      loading={loading}
      label={label}
      {...rest}
    />
  );
}
