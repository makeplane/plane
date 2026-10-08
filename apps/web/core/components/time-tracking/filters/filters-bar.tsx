/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ListFilter, Search } from "lucide-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TTimeEntryFilters } from "@plane/types";
import { CustomMenu, CustomSelect, Input } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ProjectDropdownBase } from "@/components/dropdowns/project/base";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUser } from "@/hooks/store/user";
import useDebounce from "@/hooks/use-debounce";
import type { TTimeTrackingFilterPatch } from "@/hooks/time-tracking/use-time-tracking-filters";
import { useTimeTrackingFilters } from "@/hooks/time-tracking/use-time-tracking-filters";
// local imports
import { DurationInput } from "../inputs/duration-input";
import { WorkItemSelect } from "../inputs/work-item-select";
import { TimeTrackingDateFilter } from "./date-filter";
import { FilterChip } from "./filter-chip";
import type { TFilterOption } from "./multi-select-filter";
import { MultiSelectFilter } from "./multi-select-filter";

type TExtraFilterKey =
  | "issue_ids"
  | "label_ids"
  | "state_ids"
  | "state_groups"
  | "cycle_ids"
  | "module_ids"
  | "priorities"
  | "assignee_ids"
  | "is_billable"
  | "source"
  | "has_issue"
  | "logged_by_ids"
  | "needs_review"
  | "duration";

const EXTRA_FILTERS: { key: TExtraFilterKey; i18n_label: string; params: (keyof TTimeEntryFilters)[] }[] = [
  { key: "issue_ids", i18n_label: "time-tracking.filters.work_items", params: ["issue_ids"] },
  { key: "label_ids", i18n_label: "time-tracking.filters.labels", params: ["label_ids"] },
  { key: "state_ids", i18n_label: "time-tracking.filters.states", params: ["state_ids"] },
  { key: "state_groups", i18n_label: "time-tracking.filters.state_groups", params: ["state_groups"] },
  { key: "cycle_ids", i18n_label: "time-tracking.filters.cycles", params: ["cycle_ids"] },
  { key: "module_ids", i18n_label: "time-tracking.filters.modules", params: ["module_ids"] },
  { key: "priorities", i18n_label: "time-tracking.filters.priorities", params: ["priorities"] },
  { key: "assignee_ids", i18n_label: "time-tracking.filters.assignees", params: ["assignee_ids"] },
  { key: "is_billable", i18n_label: "time-tracking.filters.billable", params: ["is_billable"] },
  { key: "source", i18n_label: "time-tracking.filters.source", params: ["source"] },
  { key: "has_issue", i18n_label: "time-tracking.filters.has_issue", params: ["has_issue"] },
  { key: "logged_by_ids", i18n_label: "time-tracking.filters.logged_by", params: ["logged_by_ids"] },
  { key: "needs_review", i18n_label: "time-tracking.filters.needs_review", params: ["needs_review"] },
  { key: "duration", i18n_label: "time-tracking.filters.duration", params: ["min_duration", "max_duration"] },
];

const STATE_GROUPS = ["backlog", "unstarted", "started", "completed", "cancelled"];
const PRIORITIES = ["urgent", "high", "medium", "low", "none"];
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

type Props = {
  workspaceSlug: string;
  /** dimensions this tab ignores (e.g. none today; kept for reuse) */
  className?: string;
};

/** The shared filter bar of the Entries and Reports tabs (plan 9.5.1). */
export const TimeTrackingFiltersBar = observer(function TimeTrackingFiltersBar({ workspaceSlug, className }: Props) {
  const { t } = useTranslation();
  const { filters, apiFilters, setFilters, clearAll, hasActiveFilters, today } = useTimeTrackingFilters();
  const { data: currentUser } = useUser();
  const { workspaceProjectIds, archivedProjectIds, getProjectById, getProjectIdentifierById } = useProject();
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  // search, debounced into the URL
  const [search, setSearch] = useState(filters.search ?? "");
  const debouncedSearch = useDebounce(search, 300);
  useEffect(() => {
    if ((filters.search ?? "") !== debouncedSearch) setFilters({ search: debouncedSearch || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);
  useEffect(() => {
    setSearch(filters.search ?? "");
  }, [filters.search]);

  // extra filters that were added from "+ Filter" but don't have a value yet
  const [pendingExtras, setPendingExtras] = useState<TExtraFilterKey[]>([]);
  const activeExtras = EXTRA_FILTERS.filter(
    (extra) =>
      pendingExtras.includes(extra.key) ||
      extra.params.some((param) => (filters as Record<string, unknown>)[param] !== undefined)
  );
  const removeExtra = (key: TExtraFilterKey) => {
    const extra = EXTRA_FILTERS.find((item) => item.key === key);
    setPendingExtras((current) => current.filter((item) => item !== key));
    if (extra) setFilters(Object.fromEntries(extra.params.map((param) => [param, null])) as TTimeTrackingFilterPatch);
  };

  const options = useFilterOptions(workspaceSlug, filters.project_ids, getProjectIdentifierById);
  const allProjectIds = useMemo(
    () => [...(workspaceProjectIds ?? []), ...(archivedProjectIds ?? [])],
    [workspaceProjectIds, archivedProjectIds]
  );

  const booleanSelect = (key: "is_billable" | "has_issue" | "needs_review") => (
    <CustomSelect
      value={filters[key] === undefined ? "any" : String(filters[key])}
      onChange={(value: string) => setFilters({ [key]: value === "any" ? null : value === "true" })}
      label={
        <span className="text-primary">
          {filters[key] === undefined
            ? t("time-tracking.filters.any")
            : filters[key]
              ? t("time-tracking.filters.yes")
              : t("time-tracking.filters.no")}
        </span>
      }
      noChevron
      buttonClassName="px-1"
    >
      <CustomSelect.Option value="true">{t("time-tracking.filters.yes")}</CustomSelect.Option>
      <CustomSelect.Option value="false">{t("time-tracking.filters.no")}</CustomSelect.Option>
    </CustomSelect>
  );

  const renderExtra = (key: TExtraFilterKey, isPending: boolean) => {
    switch (key) {
      case "issue_ids":
        return (
          <span className="flex items-center gap-1">
            {filters.issue_ids?.length ? <span className="text-primary">{filters.issue_ids.length}</span> : null}
            <WorkItemSelect
              workspaceSlug={workspaceSlug}
              projectId={filters.project_ids?.length === 1 ? filters.project_ids[0] : null}
              value={null}
              required
              onChange={(issueId) =>
                issueId && setFilters({ issue_ids: Array.from(new Set([...(filters.issue_ids ?? []), issueId])) })
              }
              buttonClassName="h-6 w-40 border-none bg-transparent px-1 text-13"
            />
          </span>
        );
      case "label_ids":
      case "state_ids":
      case "cycle_ids":
      case "module_ids":
        return (
          <MultiSelectFilter
            value={filters[key] ?? []}
            options={options[key]}
            onChange={(value) => setFilters({ [key]: value })}
            defaultOpen={isPending}
          />
        );
      case "state_groups":
        return (
          <MultiSelectFilter
            value={filters.state_groups ?? []}
            options={STATE_GROUPS.map((group) => ({ value: group, label: capitalize(group) }))}
            onChange={(value) => setFilters({ state_groups: value as TTimeEntryFilters["state_groups"] })}
            defaultOpen={isPending}
          />
        );
      case "priorities":
        return (
          <MultiSelectFilter
            value={filters.priorities ?? []}
            options={PRIORITIES.map((priority) => ({ value: priority, label: capitalize(priority) }))}
            onChange={(value) => setFilters({ priorities: value as TTimeEntryFilters["priorities"] })}
            defaultOpen={isPending}
          />
        );
      case "assignee_ids":
      case "logged_by_ids":
        return (
          <MemberDropdown
            value={filters[key] ?? []}
            multiple
            memberIds={workspaceMemberIds ?? []}
            onChange={(value) => setFilters({ [key]: value })}
            buttonVariant="transparent-with-text"
            buttonClassName="h-6 px-1"
            placeholder={t("time-tracking.filters.any")}
          />
        );
      case "is_billable":
      case "has_issue":
      case "needs_review":
        return booleanSelect(key);
      case "source":
        return (
          <CustomSelect
            value={filters.source ?? "any"}
            onChange={(value: string) => setFilters({ source: value === "any" ? null : (value as "timer" | "manual") })}
            label={
              <span className="text-primary">
                {filters.source ? t(`time-tracking.source.${filters.source}`) : t("time-tracking.filters.any")}
              </span>
            }
            noChevron
            buttonClassName="px-1"
          >
            <CustomSelect.Option value="timer">{t("time-tracking.source.timer")}</CustomSelect.Option>
            <CustomSelect.Option value="manual">{t("time-tracking.source.manual")}</CustomSelect.Option>
          </CustomSelect>
        );
      case "duration":
        return (
          <span className="flex items-center gap-1">
            <span className="w-20">
              <DurationInput
                compact
                allowEmpty
                value={filters.min_duration ?? null}
                onChange={(seconds) => setFilters({ min_duration: seconds })}
                placeholder={t("time-tracking.filters.min")}
              />
            </span>
            <span className="text-tertiary">–</span>
            <span className="w-20">
              <DurationInput
                compact
                allowEmpty
                value={filters.max_duration ?? null}
                onChange={(seconds) => setFilters({ max_duration: seconds })}
                placeholder={t("time-tracking.filters.max")}
              />
            </span>
          </span>
        );
    }
  };

  const availableExtras = EXTRA_FILTERS.filter((extra) => !activeExtras.includes(extra));

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <TimeTrackingDateFilter
        filters={filters}
        resolvedRange={{ from: apiFilters.date_from, to: apiFilters.date_to }}
        setFilters={setFilters}
        today={today}
      />

      <div className="flex items-center gap-1">
        <MemberDropdown
          value={filters.user_ids ?? []}
          multiple
          memberIds={workspaceMemberIds ?? []}
          onChange={(value) => setFilters({ user_ids: value })}
          buttonVariant="border-with-text"
          buttonClassName="h-7"
          placeholder={t("time-tracking.filters.people")}
        />
        {currentUser && (
          <button
            type="button"
            onClick={() =>
              setFilters({
                user_ids:
                  filters.user_ids?.length === 1 && filters.user_ids[0] === currentUser.id ? null : [currentUser.id],
              })
            }
            className={cn(
              "h-7 rounded-md border-[0.5px] border-subtle-1 px-2 text-13 text-secondary hover:bg-layer-2-hover",
              {
                "border-accent-strong bg-accent-subtle text-accent-primary":
                  filters.user_ids?.length === 1 && filters.user_ids[0] === currentUser.id,
              }
            )}
          >
            {t("time-tracking.filters.me")}
          </button>
        )}
      </div>

      <ProjectDropdownBase
        value={filters.project_ids ?? []}
        multiple
        onChange={(value) => setFilters({ project_ids: value })}
        projectIds={allProjectIds}
        getProjectById={getProjectById}
        buttonVariant="border-with-text"
        buttonClassName="h-7"
        placeholder={t("time-tracking.filters.projects")}
        dropdownArrow
      />

      {activeExtras.map((extra) => (
        <FilterChip key={extra.key} label={t(extra.i18n_label)} onRemove={() => removeExtra(extra.key)}>
          {renderExtra(extra.key, pendingExtras.includes(extra.key))}
        </FilterChip>
      ))}

      {availableExtras.length > 0 && (
        <CustomMenu
          customButton={
            <span className="flex h-7 items-center gap-1 rounded-md px-2 text-13 text-secondary hover:bg-layer-transparent-hover">
              <ListFilter className="size-3.5" />
              {t("time-tracking.filters.add_filter")}
            </span>
          }
          placement="bottom-start"
          closeOnSelect
        >
          {availableExtras.map((extra) => (
            <CustomMenu.MenuItem key={extra.key} onClick={() => setPendingExtras((current) => [...current, extra.key])}>
              {t(extra.i18n_label)}
            </CustomMenu.MenuItem>
          ))}
        </CustomMenu>
      )}

      <div className="flex h-7 items-center gap-1.5 rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-2">
        <Search className="size-3.5 text-tertiary" />
        <Input
          mode="true-transparent"
          inputSize="xs"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("time-tracking.filters.search_placeholder")}
          className="w-56 px-0"
        />
      </div>

      {(hasActiveFilters || pendingExtras.length > 0) && (
        <button
          type="button"
          onClick={() => {
            setPendingExtras([]);
            setSearch("");
            clearAll();
          }}
          className="text-13 text-accent-primary hover:underline"
        >
          {t("time-tracking.filters.clear_all")}
        </button>
      )}
    </div>
  );
});

/** Label / state / cycle / module options from the workspace stores, narrowed to the selected projects. */
const useFilterOptions = (
  workspaceSlug: string,
  projectIds: string[] | undefined,
  getProjectIdentifierById: (projectId: string | null | undefined) => string
) => {
  const { workspaceLabels, fetchWorkspaceLabels } = useLabel();
  const { workspaceStates, fetchWorkspaceStates } = useProjectState();
  const { cycleMap, fetchWorkspaceCycles } = useCycle();
  const { moduleMap, fetchWorkspaceModules } = useModule();

  useSWR(
    `TIME_TRACKING_FILTER_OPTIONS_${workspaceSlug}`,
    () =>
      Promise.all([
        fetchWorkspaceLabels(workspaceSlug),
        fetchWorkspaceStates(workspaceSlug),
        fetchWorkspaceCycles(workspaceSlug),
        fetchWorkspaceModules(workspaceSlug),
      ]),
    { revalidateOnFocus: false }
  );

  return useMemo(() => {
    const inScope = (projectId: string | null | undefined) =>
      !!projectId && (!projectIds?.length || projectIds.includes(projectId));
    const toOption = (item: { id: string; name: string; project_id?: string | null }): TFilterOption => ({
      value: item.id,
      label: item.name,
      hint: item.project_id ? getProjectIdentifierById(item.project_id) : undefined,
    });
    return {
      label_ids: (workspaceLabels ?? []).filter((label) => inScope(label.project_id)).map(toOption),
      state_ids: (workspaceStates ?? []).filter((state) => inScope(state.project_id)).map(toOption),
      cycle_ids: Object.values(cycleMap)
        .filter((cycle) => inScope(cycle.project_id))
        .map(toOption),
      module_ids: Object.values(moduleMap)
        .filter((module) => inScope(module.project_id))
        .map(toOption),
    };
  }, [workspaceLabels, workspaceStates, cycleMap, moduleMap, projectIds, getProjectIdentifierById]);
};
