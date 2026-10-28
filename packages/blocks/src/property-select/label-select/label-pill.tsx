/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Pill, PillLabel } from "@makeplane/propel/elements/pill";
import { Swatch } from "@makeplane/propel/elements/swatch";
import { cn } from "@plane/utils";

/** Widest a label pill grows before its name truncates — Propel's pill cap. */
export const LABEL_PILL_MAX_WIDTH_PX = 224;

/** Swatch fill for a label whose colour is not known (e.g. a label that has not loaded yet). */
const FALLBACK_SWATCH_FILL = "currentColor";

export type LabelPillVariant = "soft" | "outline";

export type LabelPillProps = {
  /** The label to show — only its name and colour are read. */
  label: { name: string; color?: string | null };
  /**
   * `soft` (filled, borderless) for label lists such as the work item sidebar; `outline` where the
   * pill sits among other outlined property chips, e.g. a list row.
   *
   * @default "soft"
   */
  variant?: LabelPillVariant;
  className?: string;
};

/**
 * One label shown as a display-only pill: a 24px Propel `Pill` (`sm`) rendered as a `<span>`, with
 * the label colour as a `Swatch` and the name as a truncating `PillLabel`. It never caps wider
 * than its container (`min(224px, 100%)`), and its cursor follows whatever control it sits in.
 */
export function LabelPill(props: LabelPillProps) {
  const { label, variant = "soft", className } = props;

  return (
    <Pill
      size="sm"
      variant={variant}
      // A display-only pill: the `<button>` Propel renders by default becomes a plain `<span>` (the
      // `type="button"` it bakes in is dropped — it is only valid on a button).
      render={(pillProps) => {
        const { type: _buttonType, ...spanProps } = pillProps as typeof pillProps & { type?: string };
        return (
          <span
            {...spanProps}
            data-slot="label-pill"
            className={cn(spanProps.className, "max-w-[min(224px,100%)] cursor-[inherit]", className)}
          />
        );
      }}
    >
      <Swatch fill={label.color || FALLBACK_SWATCH_FILL} />
      <PillLabel>{label.name}</PillLabel>
    </Pill>
  );
}
