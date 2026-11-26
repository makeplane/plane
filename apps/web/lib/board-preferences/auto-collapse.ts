/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * collapse empty groups automatically.
 *
 * With auto_collapse_empty_groups on, a group (kanban column, kanban sub-group row, list group) is collapsed
 * if and only if its count is 0. The count comes from the board's own getGroupIssueCount, so the collapse
 * follows every count change: local edits, live applies (updateIssueList / addIssueToList) and the coarse
 * refetch (fetchIssuesWithExistingPagination, used for "*" events, full_refresh and resyncs).
 *
 * A click on a group header while it is on is a session override for this tab: it inverts the automatic
 * state (collapses a non-empty group, expands an empty one) until the group's emptiness changes, then the
 * automatic state applies again. Overrides are never stored in the kanban_filters collapse list.
 *
 * With the setting off, the stored collapse list and its toggle are passed through unchanged.
 *
 * a drop onto a collapsed group must open it, so drops call expandGroup, never the toggle.
 * The drop updates the board store before the drop handler returns, so by the time a toggle ran the group was
 * already non-empty, and the toggle recorded an override that inverted the new automatic state: the group the
 * ticket moved into stayed collapsed. expandGroup clears the group's override instead, so the group follows
 * its count (open as soon as it holds the ticket; collapsed again if the move is refused or reverted).
 */

import { useCallback, useEffect, useRef } from "react";
import { action, observable } from "mobx";
// plane imports
import type { EIssuesStoreType, GroupByColumnTypes, TIssueKanbanFilters } from "@plane/types";
// components
import { getGroupByColumns, isWorkspaceLevel } from "@/components/issues/issue-layouts/utils";
// hooks
import { useUser } from "@/hooks/store/user";
// local imports
import { getBoardPreferencesStore } from "./store";

type TToggle = "group_by" | "sub_group_by";

/** session overrides: key -> whether the group was empty when it was clicked */
const overrides = observable.map<string, boolean>();

const overrideKey = (scope: string, toggle: TToggle, groupId: string) => `${scope}|${toggle}|${groupId}`;

/** Collapsed or not, for a group that is `empty`, given its override (if any). */
export const isGroupCollapsed = (empty: boolean, override: boolean | undefined): boolean =>
  override === undefined || override !== empty ? empty : !empty;

const toggleOverride = action((key: string, empty: boolean) => {
  if (overrides.get(key) === empty) overrides.delete(key);
  else overrides.set(key, empty);
});

const clearOverride = action((key: string) => {
  overrides.delete(key);
});

const dropStaleOverrides = action((keys: Map<string, boolean>) => {
  for (const [key, empty] of keys) {
    const override = overrides.get(key);
    if (override !== undefined && override !== empty) overrides.delete(key);
  }
});

/** True when the current user has the setting on. Observable: use inside observer components. */
export const useAutoCollapseEnabled = (): boolean => {
  const { data: currentUser } = useUser();
  const userId = currentUser?.id;
  const store = getBoardPreferencesStore();
  useEffect(() => {
    void store.ensure(userId);
  }, [store, userId]);
  return store.isLoadedFor(userId) && store.settings.auto_collapse_empty_groups;
};

/** The group ids a board renders for a grouping, the same way the kanban and list layouts list them. */
export const getBoardGroupIds = (
  groupBy: string | null | undefined,
  storeType: EIssuesStoreType,
  isEpic: boolean
): string[] =>
  getGroupByColumns({
    groupBy: (groupBy ?? null) as GroupByColumnTypes,
    includeNone: true,
    isWorkspaceLevel: isWorkspaceLevel(storeType),
    isEpic,
  })?.map((group) => group.id) ?? [];

type TParams = {
  storeType: EIssuesStoreType;
  groupBy: string | null | undefined;
  subGroupBy: string | null | undefined;
  /** group ids of the board, as rendered (getGroupByColumns) */
  groupIds: string[];
  subGroupIds: string[];
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  /** false while the board's first load is in flight: counts are not known yet, nothing collapses */
  loaded: boolean;
  stored: TIssueKanbanFilters;
  onStoredToggle: (toggle: TToggle, groupId: string) => void;
};

/**
 * The collapse state a board renders. Returns the stored state and toggle unchanged while the setting is off.
 */
export const useAutoCollapseGroups = (params: TParams) => {
  const { storeType, groupBy, subGroupBy, groupIds, subGroupIds, getGroupIssueCount, loaded, stored, onStoredToggle } =
    params;
  const enabled = useAutoCollapseEnabled();
  const scope = `${storeType}|${groupBy ?? ""}|${subGroupBy ?? ""}`;

  const isEmpty = useCallback(
    (toggle: TToggle, groupId: string) =>
      !(toggle === "group_by"
        ? getGroupIssueCount(groupId, undefined, false)
        : getGroupIssueCount(undefined, groupId, true)),
    [getGroupIssueCount]
  );

  const emptiness = new Map<string, boolean>();
  if (enabled && loaded) {
    for (const id of groupIds) emptiness.set(overrideKey(scope, "group_by", id), isEmpty("group_by", id));
    for (const id of subGroupIds) emptiness.set(overrideKey(scope, "sub_group_by", id), isEmpty("sub_group_by", id));
  }

  // an override ends when the group's emptiness changes (runs after every render, so after count changes)
  useEffect(() => {
    if (emptiness.size > 0) dropStaleOverrides(emptiness);
  });

  const handleToggle = useCallback(
    (toggle: TToggle, groupId: string) => {
      if (!enabled) return onStoredToggle(toggle, groupId);
      toggleOverride(overrideKey(scope, toggle, groupId), isEmpty(toggle, groupId));
    },
    [enabled, onStoredToggle, scope, isEmpty]
  );

  // latest values for expandGroup, which drop targets capture once (their effects do not re-subscribe on every render)
  const latest = useRef({ enabled, scope, stored, onStoredToggle });
  latest.current = { enabled, scope, stored, onStoredToggle };

  /** Opens a group after a drop: auto mode drops its override; off, it opens a group the stored list collapses. */
  const expandGroup = useCallback((toggle: TToggle, groupId: string) => {
    const current = latest.current;
    if (current.enabled) return clearOverride(overrideKey(current.scope, toggle, groupId));
    if (current.stored[toggle]?.includes(groupId)) current.onStoredToggle(toggle, groupId);
  }, []);

  if (!enabled) return { autoCollapse: false, collapsedGroups: stored, handleToggle, expandGroup };
  if (!loaded)
    return { autoCollapse: true, collapsedGroups: { group_by: [], sub_group_by: [] }, handleToggle, expandGroup };

  const collapsed = (toggle: TToggle, ids: string[]) =>
    ids.filter((id) => {
      const key = overrideKey(scope, toggle, id);
      return isGroupCollapsed(emptiness.get(key) ?? false, overrides.get(key));
    });
  const collapsedGroups: TIssueKanbanFilters = {
    group_by: collapsed("group_by", groupIds),
    sub_group_by: collapsed("sub_group_by", subGroupIds),
  };
  return { autoCollapse: true, collapsedGroups, handleToggle, expandGroup };
};
