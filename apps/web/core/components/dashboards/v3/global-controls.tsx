/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Global dashboard controls (spec §8).
 *
 * Time range, date basis and the viewer-scoped scope filters, plus the reset
 * that returns the whole preference bag to product defaults (§8.4). Every
 * option list is built from what the viewer can already see, so the dashboard
 * never offers a project the engine would refuse to count (§8.3, §20).
 *
 * A control change only writes to the preferences store. The shell owns the
 * debounce and the single batch request that follows.
 */

import { ANALYTICS_DATE_BASIS_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CustomSearchSelect } from "@plane/ui";
import type { TAnalyticsTimePreset } from "@plane/types";
import { ProjectSelect } from "@/components/analytics/select/project";
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
import { useProject } from "@/hooks/store/use-project";

import type { TWorkspaceDashboardGlobalScope } from "./batch-composer";

/**
 * §8 — single-value trigger label. Renders the control label, a separator,
 * and the resolved option's `query`. When the engine returns a value the
 * options list doesn't know about (defensive, shouldn't happen) we fall
 * back to the label so the trigger never reads empty.
 */
function TriggerRow({ label, option, fallback }: { label: string; option?: { query: string }; fallback: string }) {
  return (
    <span className="flex items-center gap-1 truncate">
      <span className="text-tertiary">{label}</span>
      <span className="text-tertiary">·</span>
      <span className="truncate font-medium">{option?.query ?? fallback}</span>
    </span>
  );
}

/** §8.1 — every preset the engine resolves, workspace-timezone aware. */
const TIME_PRESET_LABEL_KEYS: { value: TAnalyticsTimePreset; labelKey: string }[] = [
  { value: "today", labelKey: "dashboard_v3.time.today" },
  { value: "yesterday", labelKey: "dashboard_v3.time.yesterday" },
  { value: "this_week", labelKey: "dashboard_v3.time.this_week" },
  { value: "last_week", labelKey: "dashboard_v3.time.last_week" },
  { value: "last_7_days", labelKey: "dashboard_v3.time.last_7_days" },
  { value: "last_30_days", labelKey: "dashboard_v3.time.last_30_days" },
  { value: "this_month", labelKey: "dashboard_v3.time.this_month" },
  { value: "last_month", labelKey: "dashboard_v3.time.last_month" },
  { value: "this_quarter", labelKey: "dashboard_v3.time.this_quarter" },
  { value: "last_quarter", labelKey: "dashboard_v3.time.last_quarter" },
  { value: "last_90_days", labelKey: "dashboard_v3.time.last_90_days" },
  { value: "this_year", labelKey: "dashboard_v3.time.this_year" },
  { value: "last_year", labelKey: "dashboard_v3.time.last_year" },
  { value: "custom", labelKey: "dashboard_v3.time.custom" },
  { value: "none", labelKey: "dashboard_v3.time.none" },
];

/** §8.3 — priorities are engine vocabulary, so the list is static and ACL-free. */
const PRIORITY_OPTIONS = [
  { value: "urgent", labelKey: "dashboard_v3.priority.urgent" },
  { value: "high", labelKey: "dashboard_v3.priority.high" },
  { value: "medium", labelKey: "dashboard_v3.priority.medium" },
  { value: "low", labelKey: "dashboard_v3.priority.low" },
  { value: "none", labelKey: "dashboard_v3.priority.none" },
];

/** §8.3 — state groups mirror the engine's `state_group` predicate. */
const STATE_GROUP_OPTIONS = [
  { value: "backlog", labelKey: "dashboard_v3.state_group.backlog" },
  { value: "unstarted", labelKey: "dashboard_v3.state_group.unstarted" },
  { value: "started", labelKey: "dashboard_v3.state_group.started" },
  { value: "completed", labelKey: "dashboard_v3.state_group.completed" },
  { value: "cancelled", labelKey: "dashboard_v3.state_group.cancelled" },
];

const toOptions = (entries: { value: string; labelKey: string }[], t: (key: string) => string) =>
  entries.map((entry) => ({
    value: entry.value,
    query: t(entry.labelKey),
    content: <span>{t(entry.labelKey)}</span>,
  }));

/** §10.2 — the engine takes ISO dates for a `custom` preset. */
const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

type Props = {
  scope: TWorkspaceDashboardGlobalScope;
  onChange: (updates: Partial<TWorkspaceDashboardGlobalScope>) => void;
  onReset: () => void;
};

export function WorkspaceDashboardGlobalControls({ scope, onChange, onReset }: Props) {
  const { t } = useTranslation();
  const { joinedProjectIds } = useProject();

  const timeOptions = toOptions(TIME_PRESET_LABEL_KEYS, t);
  const priorityOptions = toOptions(PRIORITY_OPTIONS, t);
  const stateGroupOptions = toOptions(STATE_GROUP_OPTIONS, t);
  const dateBasisOptions = ANALYTICS_DATE_BASIS_OPTIONS.map((option) => ({
    value: option.value as string,
    query: option.label,
    content: <span>{option.label}</span>,
  }));

  const setFilter = (key: string, values: string[] | null) => {
    const filters = { ...scope.filters };
    if (!values || values.length === 0) delete filters[key];
    else filters[key] = values;
    onChange({ filters });
  };

  return (
    <div className="flex flex-col gap-2 border-b border-subtle px-5 py-3" data-testid="dashboard-v3-global-controls">
      <div className="flex flex-wrap items-center gap-2">
        <ProjectSelect
          value={scope.projectIds}
          projectIds={joinedProjectIds}
          onChange={(projectIds) => onChange({ projectIds: projectIds ?? [] })}
        />
        <CustomSearchSelect
          value={[scope.timePreset]}
          onChange={(value: string[]) => onChange({ timePreset: value[0] as TAnalyticsTimePreset })}
          options={timeOptions}
          label={t("dashboard_v3.control.time_range")}
          selectedContent={(_value, option) => (
            <TriggerRow
              label={t("dashboard_v3.control.time_range")}
              option={option}
              fallback={t("dashboard_v3.control.time_range")}
            />
          )}
        />
        <CustomSearchSelect
          value={[scope.dateBasis]}
          onChange={(value: string[]) =>
            onChange({ dateBasis: value[0] as TWorkspaceDashboardGlobalScope["dateBasis"] })
          }
          options={dateBasisOptions}
          label={t("dashboard_v3.control.date_basis")}
          selectedContent={(_value, option) => (
            <TriggerRow
              label={t("dashboard_v3.control.date_basis")}
              option={option}
              fallback={t("dashboard_v3.control.date_basis")}
            />
          )}
        />
        <CustomSearchSelect
          value={scope.filters.priority ?? []}
          onChange={(value: string[]) => setFilter("priority", value)}
          options={priorityOptions}
          label={t("dashboard_v3.control.priority")}
          multiple
          selectedContent={(_value, option) => (
            <TriggerRow
              label={t("dashboard_v3.control.priority")}
              option={option}
              fallback={t("dashboard_v3.control.priority")}
            />
          )}
          multipleLabel={(count) => t("dashboard_v3.control.selected_count", { count })}
        />
        <CustomSearchSelect
          value={scope.filters.state_group ?? []}
          onChange={(value: string[]) => setFilter("state_group", value)}
          options={stateGroupOptions}
          label={t("dashboard_v3.control.states")}
          multiple
          selectedContent={(_value, option) => (
            <TriggerRow
              label={t("dashboard_v3.control.states")}
              option={option}
              fallback={t("dashboard_v3.control.states")}
            />
          )}
          multipleLabel={(count) => t("dashboard_v3.control.selected_count", { count })}
        />
        <Button variant="tertiary" size="sm" onClick={onReset} data-testid="dashboard-v3-reset">
          {t("dashboard_v3.control.reset")}
        </Button>
      </div>
      {scope.timePreset === "custom" ? (
        <div className="flex flex-wrap items-center gap-2" data-testid="dashboard-v3-custom-range">
          <DateRangeDropdown
            buttonVariant="background-with-text"
            value={{
              from: scope.customRange?.start ? new Date(scope.customRange.start) : undefined,
              to: scope.customRange?.end ? new Date(scope.customRange.end) : undefined,
            }}
            onSelect={(range) =>
              onChange({
                customRange:
                  range?.from && range?.to ? { start: toIsoDate(range.from), end: toIsoDate(range.to) } : undefined,
              })
            }
          />
        </div>
      ) : null}
    </div>
  );
}
