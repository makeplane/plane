/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { PropertiesOverflowMenu } from "./properties-overflow-menu";
import type { WorkItemPropertyEntry } from "./types";
import { getChipMeasureId, usePropertiesOverflow } from "./use-properties-overflow";

export type PropertiesOverflowRowProps = {
  /** Property entries in row order, already filtered to the ones the row shows. */
  entries: WorkItemPropertyEntry[];
  /**
   * Room for the chips in px (excluding anything else in the row). `null` renders every chip and
   * no "+N" — use it before the first measurement and wherever the row wraps instead.
   */
  availableWidth: number | null;
  /** Classes for the chip container; its flex gap must match `gapPx`. */
  className?: string;
  /** @default 8 (`gap-2`) */
  gapPx?: number;
  /** Translated heading of the "+N" menu, e.g. "Properties". */
  menuLabel: string;
  /** Accessible name of the "+N" trigger for a hidden count, e.g. "3 more properties". */
  getTriggerAriaLabel: (hiddenCount: number) => string;
  /** Closes the "+N" menu while true, e.g. while the row is being dragged. */
  forceCloseMenu?: boolean;
  /** Changing it re-measures every chip, e.g. after a locale switch. */
  remeasureKey?: string | number;
};

/**
 * A work item's property chips on one line: the chips that fit `availableWidth` (most important
 * first, see `WORK_ITEM_PROPERTY_HIDE_ORDER`) followed by a "+N" pill whose Properties menu holds
 * the rest. Entries with `variants` shrink before they collapse.
 */
export function PropertiesOverflowRow(props: PropertiesOverflowRowProps) {
  const {
    entries,
    availableWidth,
    className,
    gapPx = 8,
    menuLabel,
    getTriggerAriaLabel,
    forceCloseMenu = false,
    remeasureKey,
  } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { layout, getChipRef, triggerRef, containerRef } = usePropertiesOverflow({
    entries,
    budget: availableWidth,
    gap: gapPx,
    isMenuOpen,
    remeasureKey,
  });

  const entryByKey = new Map(entries.map((entry) => [entry.key, entry]));
  const hiddenEntries = layout.hiddenKeys.flatMap((key) => entryByKey.get(key) ?? []);
  const hasHiddenEntries = hiddenEntries.length > 0;

  // Close the menu while rendering (not in an effect) when the parent forces it shut, or when edits
  // elsewhere leave nothing collapsed, so it never paints open for a frame.
  if (isMenuOpen && (forceCloseMenu || !hasHiddenEntries)) setIsMenuOpen(false);

  if (entries.length === 0) return null;

  return (
    <div ref={containerRef} className={className}>
      {layout.visibleKeys.map((key) => {
        const entry = entryByKey.get(key);
        if (!entry) return null;
        const variantId = layout.variantByKey.get(key);
        const variants = entry.variants ?? [];
        // Until a refit catches up with a reshaped entry, fall back to its smallest rendering.
        const variant = variants.find((candidate) => candidate.id === variantId) ?? variants.at(-1);
        return (
          <div
            key={key}
            ref={getChipRef(key)}
            data-measure-id={getChipMeasureId(entry, variant)}
            className="flex min-w-0 shrink-0 items-center"
          >
            {variant ? variant.chip : entry.chip}
          </div>
        );
      })}
      {hasHiddenEntries && (
        <PropertiesOverflowMenu
          entries={hiddenEntries}
          label={menuLabel}
          triggerAriaLabel={getTriggerAriaLabel(hiddenEntries.length)}
          open={isMenuOpen}
          onOpenChange={setIsMenuOpen}
          triggerRef={triggerRef}
        />
      )}
    </div>
  );
}
