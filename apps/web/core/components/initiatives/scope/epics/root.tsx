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

import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo } from "react";
// plane imports
import { EIssueFilterType, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EIssueLayoutTypes, EIssuesStoreType } from "@plane/types";
// assets
import initiativesListDark from "@/app/assets/empty-state/initiatives/scope/initiatives-list-dark.webp?url";
import initiativesListLight from "@/app/assets/empty-state/initiatives/scope/initiatives-list-light.webp?url";
// components
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { EpicPeekOverview } from "@/components/epics/peek-overview";
import { AddScopeButton } from "@/components/initiatives/common/add-scope-button";
import { ListLayoutLoader } from "@/components/ui/loader/layouts/list-layout-loader";
import { WorkspaceLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/workspace-level";
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row/basic";
// hooks
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
// plane web imports
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local imports
import { InitiativeScopeEpicBoard } from "./board";
import { InitiativeScopeEpicList } from "./list";
import { InitiativeScopeEpicTimeline } from "./timeline";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  permissions: {
    canAddScope: boolean;
    canRemoveEpic: boolean;
    canEditEpic: (epicId: string) => boolean;
  };
  handleAddEpic: () => void;
  handleAddProject: () => void;
};

export const InitiativeScopeEpicsRoot = observer(function InitiativeScopeEpicsRoot(props: Props) {
  const { workspaceSlug, initiativeId, permissions, handleAddEpic, handleAddProject } = props;

  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();

  // store hooks
  const {
    initiative: {
      scope: {
        getDisplayFilters,
        epics: { groupedIssueIds, getIssueLoader, fetchIssues, filters: epicsFilterStore },
      },
    },
  } = useInitiatives();

  // Set current initiative ID on mount; clean up on unmount (tab switch)
  useEffect(() => {
    if (epicsFilterStore.currentInitiativeId !== initiativeId) {
      epicsFilterStore.setCurrentInitiativeId(initiativeId);
    }
    return () => {
      epicsFilterStore.setCurrentInitiativeId(undefined);
    };
  }, [initiativeId, epicsFilterStore]);

  // derived values
  // getIssueIds() can't return a flat list because the filter store always sets layout=KANBAN
  // (which makes groupBy always defined). Flatten groupedIssueIds directly instead.
  const displayFilters = getDisplayFilters(initiativeId);
  const epicGroupBy = displayFilters?.epicGroupBy;
  const activeLayout = (displayFilters?.activeLayout ?? EIssueLayoutTypes.LIST) as Exclude<
    EIssueLayoutTypes,
    EIssueLayoutTypes.SPREADSHEET | EIssueLayoutTypes.CALENDAR
  >;

  const epicIds = useMemo(() => {
    if (!groupedIssueIds) return [];
    return Object.values(groupedIssueIds)
      .flat()
      .filter((id): id is string => typeof id === "string");
  }, [groupedIssueIds]);

  const isEpicsLoading = getIssueLoader() === "init-loader";
  const epicFiltersData = epicsFilterStore.getInitiativeEpicsFiltersById(initiativeId);

  const allowedFilters = useMemo(
    () =>
      ISSUE_DISPLAY_FILTERS_BY_PAGE.epics.filters.filter(
        (filterId) => filterId !== "created_at" && filterId !== "updated_at" && filterId !== "name"
      ),
    []
  );

  // Fetch epics for list/gantt layouts; kanban fetches internally via BaseKanBanRoot. Refetch when group by changes.
  useEffect(() => {
    if (!workspaceSlug || !initiativeId) return;
    if (activeLayout !== EIssueLayoutTypes.KANBAN) {
      const paginationOptions = { canGroup: true, perPageCount: 100 };
      fetchIssues(workspaceSlug, initiativeId, "init-loader", paginationOptions);
    }
  }, [workspaceSlug, initiativeId, activeLayout, epicGroupBy, fetchIssues]);

  const resolvedAssetPath = resolvedTheme === "light" ? initiativesListLight : initiativesListDark;

  return (
    <WorkspaceLevelWorkItemFiltersHOC
      entityType={EIssuesStoreType.INITIATIVE_EPIC}
      entityId={initiativeId}
      filtersToShowByLayout={allowedFilters}
      initialWorkItemFilters={epicFiltersData}
      updateFilters={async (updatedFilters) => {
        if (updatedFilters.type === "rich_filters") {
          await epicsFilterStore.updateEpicFilters(
            workspaceSlug,
            EIssueFilterType.RICH_FILTERS,
            updatedFilters.expression,
            initiativeId
          );
        }
      }}
      workspaceSlug={workspaceSlug}
    >
      {({ filter }) => {
        if (!filter) return undefined;

        return (
          <IssuesStoreContext.Provider value={EIssuesStoreType.INITIATIVE_EPIC}>
            <div className="flex flex-col h-full">
              {/* Epic filters row */}
              {filter.richFiltersInstance && <WorkItemFiltersRow filter={filter.richFiltersInstance} />}

              {/* Main layout */}
              <div className="relative h-full w-full overflow-hidden">
                {activeLayout === EIssueLayoutTypes.LIST ? (
                  <InitiativeScopeEpicList permissions={permissions} workspaceSlug={workspaceSlug} />
                ) : activeLayout === EIssueLayoutTypes.KANBAN ? (
                  <InitiativeScopeEpicBoard permissions={permissions} workspaceSlug={workspaceSlug} />
                ) : activeLayout === EIssueLayoutTypes.GANTT ? (
                  isEpicsLoading ? (
                    <ListLayoutLoader />
                  ) : epicIds.length === 0 ? (
                    <DetailedEmptyState
                      assetPath={resolvedAssetPath}
                      title={t("initiatives.scope.empty_state.title")}
                      description={t("initiatives.scope.empty_state.description")}
                      customPrimaryButton={
                        <AddScopeButton
                          canAdd={permissions.canAddScope}
                          workspaceSlug={workspaceSlug}
                          initiativeId={initiativeId}
                          customButton={<Button>{t("initiatives.scope.empty_state.primary_button.text")}</Button>}
                        />
                      }
                    />
                  ) : (
                    <InitiativeScopeEpicTimeline
                      epicIds={epicIds}
                      workspaceSlug={workspaceSlug}
                      initiativeId={initiativeId}
                      permissions={permissions}
                      handleAddEpic={handleAddEpic}
                      handleAddProject={handleAddProject}
                    />
                  )
                ) : null}
              </div>

              <EpicPeekOverview />
            </div>
          </IssuesStoreContext.Provider>
        );
      }}
    </WorkspaceLevelWorkItemFiltersHOC>
  );
});
