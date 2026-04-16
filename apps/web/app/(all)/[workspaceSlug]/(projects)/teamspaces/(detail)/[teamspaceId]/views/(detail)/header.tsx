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

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { LockIcon, TeamsIcon, ViewsIcon } from "@plane/propel/icons";
// plane imports
import { EIssueFilterType, ISSUE_DISPLAY_FILTERS_BY_PAGE, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
// types
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties, ICustomSearchSelectOption } from "@plane/types";
import { EIssuesStoreType, EUserWorkspaceRoles, EViewAccess, EIssueLayoutTypes } from "@plane/types";
// ui
import { Breadcrumbs, Tooltip, Header, Loader, BreadcrumbNavigationSearchDropdown } from "@plane/ui";
// components
import { getPublishViewLink } from "@plane/utils";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SwitcherIcon, SwitcherLabel } from "@/components/common/switcher-label";
import { DisplayFiltersSelection, FiltersDropdown, LayoutSelection } from "@/components/issues/issue-layouts/filters";
import { WorkItemFiltersToggle } from "@/components/work-item-filters/filters-toggle";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssues } from "@/hooks/store/use-issues";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useAppRouter } from "@/hooks/use-app-router";
import { useTeamspaceViews } from "@/plane-web/hooks/store/teamspaces/use-teamspace-views";
import { useTeamspaces } from "@/plane-web/hooks/store/teamspaces/use-teamspaces";

export const TeamspaceViewWorkItemsHeader = observer(function TeamspaceViewWorkItemsHeader() {
  // router
  const { workspaceSlug: routerWorkspaceSlug, teamspaceId: routerTeamspaceId, viewId: routerViewId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const teamspaceId = routerTeamspaceId ? routerTeamspaceId.toString() : undefined;
  const viewId = routerViewId ? routerViewId.toString() : undefined;
  const router = useAppRouter();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(EIssuesStoreType.TEAM_VIEW);
  const { toggleCreateIssueModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const { loader, getTeamspaceById, getTeamspaceProjectIds } = useTeamspaces();
  const { getViewById, getTeamspaceViewIds } = useTeamspaceViews();
  // derived values
  const teamspace = teamspaceId ? getTeamspaceById(teamspaceId) : undefined;
  const view = teamspace && viewId ? getViewById(teamspace.id, viewId.toString()) : null;
  const activeLayout = issueFilters?.displayFilters?.layout;
  const publishLink = getPublishViewLink(view?.anchor);
  const teamspaceProjectIds = teamspaceId ? getTeamspaceProjectIds(teamspaceId) : [];
  const teamspaceViewIds = teamspaceId ? getTeamspaceViewIds(teamspaceId) : [];

  const switcherOptions = teamspaceViewIds
    ?.map((id) => {
      if (!teamspaceId) return;
      const _view = id === viewId ? view : getViewById(teamspaceId, id);
      if (!_view) return;
      return {
        value: _view.id,
        query: _view.name,
        content: <SwitcherLabel logo_props={_view.logo_props} name={_view.name} LabelIcon={ViewsIcon} />,
      };
    })
    .filter((option) => option !== undefined) as ICustomSearchSelectOption[];
  // permissions
  const canUserCreateIssue = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!workspaceSlug || !teamspaceId || !viewId) return;
      updateFilters(
        workspaceSlug.toString(),
        teamspaceId.toString(),
        EIssueFilterType.DISPLAY_FILTERS,
        { layout: layout },
        viewId.toString()
      );
    },
    [workspaceSlug, teamspaceId, viewId, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !teamspaceId || !viewId) return;
      updateFilters(
        workspaceSlug.toString(),
        teamspaceId.toString(),
        EIssueFilterType.DISPLAY_FILTERS,
        updatedDisplayFilter,
        viewId.toString()
      );
    },
    [workspaceSlug, teamspaceId, viewId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !teamspaceId || !viewId) return;
      updateFilters(
        workspaceSlug.toString(),
        teamspaceId.toString(),
        EIssueFilterType.DISPLAY_PROPERTIES,
        property,
        viewId.toString()
      );
    },
    [workspaceSlug, teamspaceId, viewId, updateFilters]
  );

  if (!workspaceSlug) return;
  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-4">
          {/* bread crumps */}
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/teamspaces`}
                  label={t("teamspaces.label")}
                  icon={<TeamsIcon className="h-4 w-4 text-tertiary" />}
                />
              }
            />
            <Breadcrumbs.Item
              component={
                <>
                  {loader === "init-loader" ? (
                    <Loader.Item height="20px" width="140px" />
                  ) : teamspace ? (
                    <BreadcrumbLink
                      href={`/${workspaceSlug}/teamspaces/${teamspaceId}`}
                      label={teamspace.name}
                      icon={teamspace.logo_props && <Logo logo={teamspace.logo_props} />}
                    />
                  ) : null}
                </>
              }
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/teamspaces/${teamspaceId}/views`}
                  label={t("views")}
                  icon={<ViewsIcon className="h-4 w-4 text-tertiary" />}
                />
              }
            />
            <Breadcrumbs.Item
              component={
                <BreadcrumbNavigationSearchDropdown
                  selectedItem={viewId?.toString() ?? ""}
                  navigationItems={switcherOptions}
                  onChange={(value: string) => {
                    router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}/views/${value}`);
                  }}
                  title={view?.name}
                  icon={
                    <Breadcrumbs.Icon>
                      <SwitcherIcon logo_props={view?.logo_props} LabelIcon={ViewsIcon} size={16} />
                    </Breadcrumbs.Icon>
                  }
                  isLast
                />
              }
            />
          </Breadcrumbs>
        </div>
        {/* View access detail */}
        {view?.access === EViewAccess.PRIVATE ? (
          <div className="cursor-default text-tertiary">
            <Tooltip tooltipContent={"Private"}>
              <LockIcon className="h-4 w-4" />
            </Tooltip>
          </div>
        ) : (
          <></>
        )}
        {/* View publish detail */}
        {view?.anchor && publishLink ? (
          <a
            href={publishLink}
            className="px-3 py-1.5 bg-success-subtle text-success-primary rounded-sm text-caption-sm-medium flex items-center gap-1.5"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="shrink-0 rounded-full size-1.5 bg-success-primary" />
            {t("common.live")}
          </a>
        ) : (
          <></>
        )}
      </Header.LeftItem>
      <Header.RightItem>
        {!view?.is_locked && (
          <LayoutSelection
            layouts={[
              EIssueLayoutTypes.LIST,
              EIssueLayoutTypes.KANBAN,
              EIssueLayoutTypes.CALENDAR,
              EIssueLayoutTypes.SPREADSHEET,
            ]}
            onChange={(layout) => handleLayoutChange(layout)}
            selectedLayout={activeLayout}
          />
        )}
        {viewId && <WorkItemFiltersToggle enablePQL entityType={EIssuesStoreType.TEAM_VIEW} entityId={viewId} />}
        {!view?.is_locked && (
          <FiltersDropdown title={t("common.display")} placement="bottom-end">
            <DisplayFiltersSelection
              layoutDisplayFiltersOptions={
                activeLayout ? ISSUE_DISPLAY_FILTERS_BY_PAGE.team_issues.layoutOptions[activeLayout] : undefined
              }
              workItemFilters={issueFilters}
              handleDisplayFiltersUpdate={handleDisplayFilters}
              handleDisplayPropertiesUpdate={handleDisplayProperties}
            />
          </FiltersDropdown>
        )}
        {canUserCreateIssue ? (
          <Button
            onClick={() => toggleCreateIssueModal(true, EIssuesStoreType.TEAM_VIEW, teamspaceProjectIds)}
            size="lg"
          >
            <div className="hidden sm:block">Add</div> work item
          </Button>
        ) : (
          <></>
        )}
      </Header.RightItem>
    </Header>
  );
});
