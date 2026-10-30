/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TModulePlotType, TStateGroups } from "@plane/types";
import { cn } from "@plane/utils";

/** Bar and grid order: done first, then work in flight, then not started, then dropped. */
const STATE_GROUP_ORDER: TStateGroups[] = ["completed", "started", "unstarted", "backlog", "cancelled"];

/** Propel state colour tokens; paired with `bg-current` to fill a bar segment or a dot. */
const STATE_GROUP_COLOR_CLASS: Record<TStateGroups, string> = {
  backlog: "text-icon-states-backlog",
  unstarted: "text-icon-states-unstarted",
  started: "text-icon-states-started",
  completed: "text-icon-states-completed",
  cancelled: "text-icon-states-cancelled",
};

type Props = {
  plotType: TModulePlotType;
  /** Work item counts, or estimate points when `plotType` is "points", per state group. */
  stateGroupCounts: Record<TStateGroups, number>;
  total: number;
  /** Rounded completion with cancelled items left out of the scope. */
  percentage: number;
  completed: number;
  scope: number;
  /** Whether the state group tiles filter the module's work items. */
  isFilterable: boolean;
  selectedStateGroups: string[];
  onStateGroupClick: (stateGroup: TStateGroups) => void;
};

export const ModuleProgressSummary = observer(function ModuleProgressSummary(props: Props) {
  const {
    plotType,
    stateGroupCounts,
    total,
    percentage,
    completed,
    scope,
    isFilterable,
    selectedStateGroups,
    onStateGroupClick,
  } = props;
  // plane hooks
  const { t } = useTranslation();

  if (total === 0)
    return <p className="text-body-xs-regular text-tertiary">{t("module.details_drawer.progress.empty")}</p>;

  const groups = STATE_GROUP_ORDER.map((group) => {
    const count = stateGroupCounts[group] ?? 0;
    return { group, count, share: Math.round((count * 100) / total) };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-h4-bold text-primary">{`${percentage}%`}</span>
          <span className="text-caption-md-regular text-tertiary">
            {t(
              plotType === "points"
                ? "module.details_drawer.progress.points_done"
                : "module.details_drawer.progress.done",
              { completed, scope }
            )}
          </span>
        </div>
        <div className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden>
          {groups
            .filter(({ count }) => count > 0)
            .map(({ group, count }) => (
              <span
                key={group}
                className={cn("h-full bg-current", STATE_GROUP_COLOR_CLASS[group])}
                style={{ flexGrow: count }}
              />
            ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
        {groups.map(({ group, count, share }) => {
          const isSelected = selectedStateGroups.includes(group);
          return (
            <button
              key={group}
              type="button"
              disabled={!isFilterable}
              aria-pressed={isFilterable ? isSelected : undefined}
              onClick={() => onStateGroupClick(group)}
              className={cn(
                "-mx-1.5 flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent-strong disabled:cursor-default",
                isFilterable && "hover:bg-layer-1-hover",
                isFilterable && isSelected && "bg-layer-1-hover"
              )}
            >
              <span className={cn("size-2 shrink-0 rounded-sm bg-current", STATE_GROUP_COLOR_CLASS[group])} />
              <span className="min-w-0 flex-1 truncate text-body-xs-regular text-secondary">
                {t(`workspace_projects.state.${group}`)}
              </span>
              <span className="text-body-xs-medium text-primary">{count}</span>
              <span className="w-8 shrink-0 text-right text-caption-md-regular text-tertiary">{`${share}%`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
