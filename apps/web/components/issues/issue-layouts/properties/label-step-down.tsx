/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode, SyntheticEvent } from "react";
import { Pill as PillChrome, PillLabel } from "@makeplane/propel/elements/pill";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { LABEL_PILL_MAX_WIDTH_PX, LabelPill } from "@plane/blocks/property-select";
import type { WorkItemPropertyVariant } from "@plane/blocks/work-item-properties";
import { cn, measureTextWidth } from "@plane/utils";
import { PROPERTY_EDITOR_OVERLAY_CLASSNAME } from "./property-editor";

/** The richest labels rendering shows at most this many label pills. */
const MAX_LABEL_PILLS = 3;

// Off-DOM width estimates for the 24px pills (Propel `Pill` sm): 8px inline padding and a 1px
// border on each side, plus a 14px swatch box and its 4px gap where the pill has one. The row
// re-measures each rendering once it paints; the margin keeps a first guess from overshooting.
const PILL_CHROME_PX = 8 * 2 + 1 * 2;
const SWATCH_CHROME_PX = 14 + 4;
const PILL_MIN_WIDTH_PX = 24;
const PILLS_GAP_PX = 4;
const ESTIMATE_MARGIN_PX = 4;

let chipFont: string | undefined;
/** The 12px caption font the pills render with, in the app's own font family. */
function getChipFont(): string {
  if (chipFont) return chipFont;
  const family = typeof document === "undefined" ? "" : window.getComputedStyle(document.body).fontFamily;
  chipFont = `400 12px ${family || "sans-serif"}`;
  return chipFont;
}

const textWidth = (text: string) => measureTextWidth(text, getChipFont());
const labelPillWidth = (name: string) =>
  PILL_CHROME_PX +
  SWATCH_CHROME_PX +
  Math.min(textWidth(name), LABEL_PILL_MAX_WIDTH_PX - PILL_CHROME_PX - SWATCH_CHROME_PX) +
  ESTIMATE_MARGIN_PX;
const countPillWidth = (text: string) =>
  Math.max(PILL_MIN_WIDTH_PX, PILL_CHROME_PX + textWidth(text)) + ESTIMATE_MARGIN_PX;

type TStepDownLabel = { id: string; name: string; color: string };

const swallowRowEvent = (event: SyntheticEvent<HTMLElement>) => {
  event.stopPropagation();
  event.preventDefault();
};

/** A display-only count pill, e.g. "+2 labels". */
function CountPill({ text }: { text: string }) {
  return (
    <PillChrome
      size="sm"
      variant="outline"
      render={(pillProps) => {
        const { type: _buttonType, ...spanProps } = pillProps as typeof pillProps & { type?: string };
        return <span {...spanProps} className={cn(spanProps.className, "cursor-[inherit]")} />;
      }}
    >
      <PillLabel>{text}</PillLabel>
    </PillChrome>
  );
}

export type TLabelsStepDownChipProps = {
  labels: TStepDownLabel[];
  /** Label pills to show; 0 shows the label picker's own trigger ("Bug" / "4 labels"). */
  pillCount: number;
  /** Count pill after the label pills, e.g. "+2 labels". */
  overflowText?: string;
  disabled: boolean;
  /** Renders the label picker. Pass `triggerClassName` to its trigger so it can sit over the pills. */
  renderPicker: (triggerClassName?: string) => ReactNode;
};

/**
 * The labels chip of a list row at one step of its step-down: up to three outlined label pills, a
 * "+N labels" pill for the rest, or — at the smallest step — the label picker's own "N labels"
 * trigger. Every step renders the picker at the same position in the tree, stretched invisibly
 * over the pills when they show, so stepping up or down while it is open never closes it.
 */
export function LabelsStepDownChip(props: TLabelsStepDownChipProps) {
  const { labels, pillCount, overflowText, disabled, renderPicker } = props;
  const showPills = pillCount > 0;

  return (
    <div
      role="presentation"
      className={cn("relative flex min-w-0 shrink-0 items-center rounded-md", {
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent-strong": showPills,
      })}
      // Read-only pills let presses through to the row; keep them from opening the work item.
      onClick={showPills && disabled ? swallowRowEvent : undefined}
    >
      <div className={showPills ? "absolute inset-0" : "flex min-w-0 items-center"}>
        {renderPicker(
          showPills ? cn(PROPERTY_EDITOR_OVERLAY_CLASSNAME, { "pointer-events-none": disabled }) : undefined
        )}
      </div>
      {showPills && (
        // Editable: the invisible picker trigger is what is announced and focused, so the pills are
        // decoration. Read-only: the disabled trigger takes no pointer, so the pills carry the names.
        <Tooltip label={labels.map((label) => label.name).join(", ")} disabled={!disabled}>
          <div className="flex min-w-0 shrink-0 items-center gap-1" aria-hidden={disabled ? undefined : true}>
            {labels.slice(0, pillCount).map((label) => (
              // Fixed cap: this auto-width row would let the pill's 100% cap grow to the full name.
              <LabelPill key={label.id} label={label} variant="outline" className="max-w-56" />
            ))}
            {overflowText && <CountPill text={overflowText} />}
          </div>
        </Tooltip>
      )}
    </div>
  );
}

type TBuildLabelStepDownParams = Omit<TLabelsStepDownChipProps, "pillCount" | "overflowText"> & {
  /** Text of the "+N labels" pill for `hiddenCount` labels. */
  getOverflowText: (hiddenCount: number) => string;
  /** Text of the picker trigger for `count` labels, e.g. "4 labels". */
  getSummaryText: (count: number) => string;
};

/**
 * The labels chip's renderings for a list row, richest first: up to three label pills, fewer pills
 * plus a "+N labels" pill, and finally the picker's "N labels" trigger. A single label has nothing
 * to step down to, so it gets no variants and the row shows the picker trigger as is.
 */
export function buildLabelStepDownVariants(params: TBuildLabelStepDownParams): WorkItemPropertyVariant[] | undefined {
  const { labels, getOverflowText, getSummaryText, ...chipProps } = params;
  const total = labels.length;
  if (total < 2) return undefined;

  const variants: WorkItemPropertyVariant[] = [];
  for (let pillCount = Math.min(MAX_LABEL_PILLS, total); pillCount >= 1; pillCount--) {
    const hiddenCount = total - pillCount;
    const overflowText = hiddenCount > 0 ? getOverflowText(hiddenCount) : undefined;
    const pillsWidth = labels.slice(0, pillCount).reduce((sum, label) => sum + labelPillWidth(label.name), 0);
    const gaps = (pillCount - 1 + (overflowText ? 1 : 0)) * PILLS_GAP_PX;
    variants.push({
      id: `pills-${pillCount}`,
      widthPx: pillsWidth + gaps + (overflowText ? countPillWidth(overflowText) : 0),
      chip: <LabelsStepDownChip {...chipProps} labels={labels} pillCount={pillCount} overflowText={overflowText} />,
    });
  }
  variants.push({
    id: "summary",
    widthPx: PILL_CHROME_PX + SWATCH_CHROME_PX + textWidth(getSummaryText(total)) + ESTIMATE_MARGIN_PX,
    chip: <LabelsStepDownChip {...chipProps} labels={labels} pillCount={0} />,
  });
  return variants;
}
