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
import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";
// plane imports
import { EIssueFilterType, EUserPermissionsLevel, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { PlusIcon } from "@plane/propel/icons";
import type { IIssueFilters, TInitiativeScopeTab } from "@plane/types";
import { EIssueLayoutTypes, EIssuesStoreType, EUserWorkspaceRoles, INITIATIVE_SCOPE_TABS } from "@plane/types";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { EpicPeekOverview } from "@/components/epics/peek-overview";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local imports
import { WorkspaceLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/workspace-level";
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row/basic";
import { cn } from "@plane/utils";
import {
  InitiativeScopeFiltersToggle,
  InitiativeScopeProjectFilterProvider,
  InitiativeScopeProjectFiltersRow,
  InitiativeScopeSharedProvider,
} from "./filters";
import { InitiativeScopeListView } from "./list/root";
import { InitiativeScopeTimelineView } from "./timeline/root";

const TABS = [
  { id: "epics" as const, label: "Epics" },
  { id: "projects" as const, label: "Projects" },
] satisfies Array<{ id: TInitiativeScopeTab; label: string }>;

export const InitiativeScopeRoot = observer(function InitiativeScopeRoot() {
  const { initiativeId, workspaceSlug } = useParams();

  // store hooks
  const {
    initiative: {
      scope: {
        getDisplayFilters,
        updateDisplayFilters,
        epics: { getInitiativeEpicsById, fetchInitiativeEpics, filters: epicsFilterStore, initiativeEpicLoader },
        projects: { getInitiativeProjectsById, fetchInitiativeProjects, initiativeProjectLoader },
      },
      toggleEpicModal,
      toggleProjectsModal,
    },
  } = useInitiatives();
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();
  // derived values
  const initiativeEpics = getInitiativeEpicsById(initiativeId?.toString());
  const initiativeProjects = getInitiativeProjectsById(initiativeId?.toString());
  const isEditable = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const displayFilters = getDisplayFilters(initiativeId?.toString());
  const activeLayout = displayFilters?.activeLayout as EIssueLayoutTypes.LIST | EIssueLayoutTypes.GANTT;
  const activeTab = displayFilters?.activeTab ?? "epics";
  const epicFiltersData = epicsFilterStore.getInitiativeEpicsFiltersById(initiativeId);

  // Filter out created_at, updated_at, and name (title) from allowed filters
  const allowedFilters = useMemo(
    () =>
      ISSUE_DISPLAY_FILTERS_BY_PAGE.epics.filters.filter(
        (filterId) => filterId !== "created_at" && filterId !== "updated_at" && filterId !== "name"
      ),
    []
  );

  // Prepare initial filters for HOC
  const initialWorkItemFilters: IIssueFilters | undefined = useMemo(() => {
    if (!epicFiltersData) return;
    return {
      richFilters: epicFiltersData.richFilters,
      displayFilters: epicFiltersData.displayFilters,
      displayProperties: epicFiltersData.displayProperties,
      kanbanFilters: epicFiltersData.kanbanFilters,
      pqlFilters: epicFiltersData.pqlFilters,
      lastUsedFilterType: epicFiltersData.lastUsedFilterType,
    };
  }, [epicFiltersData]);

  // Handle tab change
  const handleTabChange = (tab: TInitiativeScopeTab) => {
    if (!initiativeId) return;
    updateDisplayFilters(initiativeId.toString(), {
      activeTab: tab,
    });
  };

  // Derive loading state from store loaders
  const isDataLoading =
    activeTab === INITIATIVE_SCOPE_TABS.EPICS
      ? initiativeEpicLoader[initiativeId?.toString()] !== "loaded"
      : initiativeProjectLoader[initiativeId?.toString()] !== "loaded";

  // Filter props based on active tab
  const scopeViewProps = useMemo(() => {
    const baseProps = {
      workspaceSlug: workspaceSlug?.toString(),
      initiativeId: initiativeId?.toString(),
      disabled: !isEditable,
      isDataLoading,
      handleAddEpic: () => toggleEpicModal(true),
      handleAddProject: () => toggleProjectsModal(true),
    };

    if (activeTab === INITIATIVE_SCOPE_TABS.EPICS) {
      return {
        ...baseProps,
        projectIds: [],
        epicIds: initiativeEpics ?? [],
      };
    } else {
      return {
        ...baseProps,
        epicIds: [],
        projectIds: initiativeProjects ?? [],
      };
    }
  }, [
    activeTab,
    initiativeEpics,
    workspaceSlug,
    initiativeId,
    isEditable,
    isDataLoading,
    toggleEpicModal,
    toggleProjectsModal,
    initiativeProjects,
  ]);

  // Layout components mapping
  const INITIATIVE_SCOPE_ACTIVE_LAYOUTS = useMemo(
    () => ({
      [EIssueLayoutTypes.LIST]: <InitiativeScopeListView {...scopeViewProps} />,
      [EIssueLayoutTypes.GANTT]: <InitiativeScopeTimelineView {...scopeViewProps} />,
    }),
    [scopeViewProps]
  );

  // Fetch epics and projects based on active tab
  useEffect(() => {
    if (!workspaceSlug || !initiativeId) return;
    if (activeTab === INITIATIVE_SCOPE_TABS.EPICS) {
      fetchInitiativeEpics(workspaceSlug.toString(), initiativeId.toString());
    } else if (activeTab === INITIATIVE_SCOPE_TABS.PROJECTS) {
      fetchInitiativeProjects(workspaceSlug.toString(), initiativeId.toString());
    }
  }, [workspaceSlug, initiativeId, activeTab, fetchInitiativeEpics, fetchInitiativeProjects]);

  if (!activeLayout) return <></>;

  // Early return if required params are missing
  if (!workspaceSlug || !initiativeId) return null;

  return (
    <InitiativeScopeSharedProvider
      workspaceSlug={workspaceSlug.toString()}
      initiativeId={initiativeId.toString()}
      activeTab={activeTab}
    >
      <InitiativeScopeProjectFilterProvider
        workspaceSlug={workspaceSlug.toString()}
        initiativeId={initiativeId.toString()}
      >
        <WorkspaceLevelWorkItemFiltersHOC
          entityType={EIssuesStoreType.EPIC}
          entityId={initiativeId}
          filtersToShowByLayout={allowedFilters}
          initialWorkItemFilters={initialWorkItemFilters}
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
          {({ filter }) =>
            filter ? (
              <>
                <div className="h-11 border-b border-subtle px-4 flex items-center gap-1">
                  <div className="flex items-center gap-1 h-full">
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={cn(
                          "relative cursor-pointer text-13 font-medium h-full transition-colors",
                          activeTab === tab.id && "border-b-2 border-primary"
                        )}
                      >
                        <div
                          className={cn(
                            "h-7 flex items-center justify-center px-3",
                            activeTab === tab.id && "bg-layer-transparent-active rounded-md"
                          )}
                        >
                          {tab.label}
                        </div>
                        <div
                          className={cn(
                            "absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-opacity duration-200",
                            activeTab === tab.id && "opacity-100"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="flex-1" />
                  {isEditable && (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() =>
                        activeTab === INITIATIVE_SCOPE_TABS.EPICS ? toggleEpicModal(true) : toggleProjectsModal(true)
                      }
                    >
                      <PlusIcon className="size-3" />
                      {activeTab === INITIATIVE_SCOPE_TABS.EPICS ? t("epic.add.label") : t("add_project")}
                    </Button>
                  )}
                  <InitiativeScopeFiltersToggle initiativeId={initiativeId} />
                </div>

                <InitiativeScopeProjectFiltersRow />
                {activeTab === INITIATIVE_SCOPE_TABS.EPICS && filter.richFiltersInstance && (
                  <WorkItemFiltersRow filter={filter.richFiltersInstance} />
                )}

                {INITIATIVE_SCOPE_ACTIVE_LAYOUTS[activeLayout]}
                <EpicPeekOverview />
              </>
            ) : undefined
          }
        </WorkspaceLevelWorkItemFiltersHOC>
      </InitiativeScopeProjectFilterProvider>
    </InitiativeScopeSharedProvider>
  );
});
