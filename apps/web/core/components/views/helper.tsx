/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useMemo } from "react";
import { LockIcon } from "@plane/propel/icons";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { EIssueLayoutTypes } from "@plane/types";
import { LayoutSelection } from "@/components/issues/issue-layouts/filters";
import { useFlag } from "@/plane-web/hooks/store";

export type TLayoutSelectionProps = {
  onChange: (layout: EIssueLayoutTypes) => void;
  selectedLayout: EIssueLayoutTypes;
  workspaceSlug: string;
};

/**
 * Configuration for layouts and their feature flags
 * To add a new layout:
 * 1. Add a useFlag call for the feature flag
 * 2. Add an entry to LAYOUT_CONFIGS with { layout, enabled }
 * SPREADSHEET layout is always available (no feature flag required)
 */
const DEFAULT_LAYOUT = EIssueLayoutTypes.SPREADSHEET;

/**
 * @description Global view layout selection component
 * @param {TLayoutSelectionProps} props
 * @returns {React.ReactNode}
 */
export function GlobalViewLayoutSelection({ onChange, selectedLayout, workspaceSlug }: TLayoutSelectionProps) {
  // Feature flag checks for each layout
  const isTimelineEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.GLOBAL_VIEWS_TIMELINE);
  const isBoardAndCalendarEnabled = useFlag(workspaceSlug, "GLOBAL_VIEWS_CAL_BOARD");

  // Configuration mapping layouts to their enabled state
  const LAYOUT_CONFIGS = useMemo(
    () => [
      { layout: EIssueLayoutTypes.GANTT, enabled: isTimelineEnabled },
      { layout: EIssueLayoutTypes.KANBAN, enabled: isBoardAndCalendarEnabled },
      { layout: EIssueLayoutTypes.CALENDAR, enabled: isBoardAndCalendarEnabled },
    ],
    [isTimelineEnabled, isBoardAndCalendarEnabled]
  );

  // Compute enabled layouts
  const enabledLayouts = useMemo(() => {
    const layouts = [DEFAULT_LAYOUT]; // SPREADSHEET is always available
    LAYOUT_CONFIGS.forEach(({ layout, enabled }) => {
      if (enabled) layouts.push(layout);
    });
    return layouts;
  }, [LAYOUT_CONFIGS]);

  /** Handle layout switch when downgraded or unsupported layout is selected */
  useEffect(() => {
    if (!enabledLayouts.includes(selectedLayout)) {
      onChange(DEFAULT_LAYOUT);
    }
  }, [enabledLayouts, selectedLayout, workspaceSlug, onChange]);

  // Show layout selection only if there are multiple layouts available
  if (enabledLayouts.length <= 1) return null;

  return <LayoutSelection layouts={enabledLayouts} onChange={onChange} selectedLayout={selectedLayout} />;
}

export function AdditionalHeaderItems({ isLocked }: { isLocked: boolean }) {
  if (!isLocked) return null;
  return (
    <div className="h-6 min-w-[76px] flex items-center justify-center gap-1.5 px-2 rounded-sm text-accent-primary bg-accent-primary/20 text-11 font-medium">
      <LockIcon className="size-3.5 shrink-0" /> Locked
    </div>
  );
}
