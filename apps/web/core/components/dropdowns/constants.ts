/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { SelectVariant } from "@plane/blocks/select";
// types
import type { TButtonVariants } from "./types";

export const BORDER_BUTTON_VARIANTS: TButtonVariants[] = ["border-with-text", "border-without-text"];

export const BACKGROUND_BUTTON_VARIANTS: TButtonVariants[] = ["background-with-text", "background-without-text"];

export const TRANSPARENT_BUTTON_VARIANTS: TButtonVariants[] = ["transparent-with-text", "transparent-without-text"];

export const BUTTON_VARIANTS_WITHOUT_TEXT: TButtonVariants[] = [
  "border-without-text",
  "background-without-text",
  "transparent-without-text",
];

export const BUTTON_VARIANTS_WITH_TEXT: TButtonVariants[] = [
  "border-with-text",
  "background-with-text",
  "transparent-with-text",
];

/**
 * The trigger chrome a legacy `buttonVariant` renders as once a legacy dropdown export forwards to
 * its `@plane/blocks` binding (critic C15 default): bordered chips become `pill-sm`, filled and
 * transparent rows `select-ghost-md`, and the text-less filled/transparent triggers the icon-only
 * `icon-sm` chrome. Only the phase-A adapters read this; call sites pick a `SelectVariant` directly.
 */
export const LEGACY_BUTTON_SELECT_VARIANT: Record<TButtonVariants, Exclude<SelectVariant, "breadcrumb">> = {
  "border-with-text": "pill-sm",
  "border-without-text": "pill-sm",
  "background-with-text": "select-ghost-md",
  "transparent-with-text": "select-ghost-md",
  "background-without-text": "icon-sm",
  "transparent-without-text": "icon-sm",
};
