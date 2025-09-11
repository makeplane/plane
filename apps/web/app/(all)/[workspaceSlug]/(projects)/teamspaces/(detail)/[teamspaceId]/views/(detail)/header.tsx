"use client";

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Layers, Lock } from "lucide-react";
// plane constants
import { EIssueFilterType, ISSUE_DISPLAY_FILTERS_BY_PAGE, EUserPermissionsLevel } from "@plane/constants";
// i18n
import { useTranslation } from "@plane/i18n";
// plane imports
import { TeamsIcon } from "@plane/propel/icons";
// types
import {
  EIssuesStoreType,
  EUserWorkspaceRoles,
  EViewAccess,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  EIssueLayoutTypes,
  IIssueFilterOptions,
  ICustomSearchSelectOption,
} from "@plane/types";
// ui
import { Breadcrumbs, Button, Tooltip, Header, Loader, BreadcrumbNavigationSearchDropdown } from "@plane/ui";
// components
import { isIssueFilterActive, getPublishViewLink } from "@plane/utils";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { Logo } from "@/components/common/logo";
import { SwitcherIcon, SwitcherLabel } from "@/components/common/switcher-label";
import {
  DisplayFiltersSelection,
  FiltersDropdown,
  FilterSelection,
  LayoutSelection,
} from "@/components/issues/issue-layouts/filters";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssues } from "@/hooks/store/use-issues";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useAppRouter } from "@/hooks/use-app-router";
import { useTeamspaceViews } from "@/plane-web/hooks/store/teamspaces/use-teamspace-views";
import { useTeamspaces } from "@/plane-web/hooks/store/teamspaces/use-teamspaces";

export const TeamspaceViewWorkItemsHeader: React.FC = observer(() => {
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
  const { workspaceLabels } = useLabel();
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
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
        content: <SwitcherLabel logo_props={_view.logo_props} name={_view.name} LabelIcon={Layers} />,
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

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !teamspaceId || !viewId) return;
      const newValues = issueFilters?.filters?.[key] ?? [];

      if (Array.isArray(value)) {
        // this validation is majorly for the filter start_date, target_date custom
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      } else {
        if (issueFilters?.filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(
        workspaceSlug.toString(),
        teamspaceId.toString(),
        EIssueFilterType.FILTERS,
        { [key]: newValues },
        viewId.toString()
      );
    },
    [workspaceSlug, teamspaceId, viewId, issueFilters, updateFilters]
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
                  icon={<TeamsIcon className="h-4 w-4 text-custom-text-300" />}
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
                  icon={<Layers className="h-4 w-4 text-custom-text-300" />}
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
                      <SwitcherIcon logo_props={view?.logo_props} LabelIcon={Layers} size={16} />
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
          <div className="cursor-default text-custom-text-300">
            <Tooltip tooltipContent={"Private"}>
              <Lock className="h-4 w-4" />
            </Tooltip>
          </div>
        ) : (
          <></>
        )}
        {/* View publish detail */}
        {view?.anchor && publishLink ? (
          <a
            href={publishLink}
            className="px-3 py-1.5 bg-green-500/20 text-green-500 rounded text-xs font-medium flex items-center gap-1.5"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="flex-shrink-0 rounded-full size-1.5 bg-green-500" />
            {t("common.live")}
          </a>
        ) : (
          <></>
        )}
      </Header.LeftItem>
      <Header.RightItem>
        {!view?.is_locked ? (
          <>
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
            <FiltersDropdown
              title={t("common.filters")}
              placement="bottom-end"
              disabled={!canUserCreateIssue}
              isFiltersApplied={isIssueFilterActive(issueFilters)}
            >
              <FilterSelection
                filters={issueFilters?.filters ?? {}}
                handleFiltersUpdate={handleFiltersUpdate}
                displayFilters={issueFilters?.displayFilters ?? {}}
                handleDisplayFiltersUpdate={handleDisplayFilters}
                layoutDisplayFiltersOptions={
                  activeLayout ? ISSUE_DISPLAY_FILTERS_BY_PAGE.team_issues[activeLayout] : undefined
                }
                labels={workspaceLabels}
                memberIds={workspaceMemberIds ?? undefined}
              />
            </FiltersDropdown>
            <FiltersDropdown title={t("common.display")} placement="bottom-end">
              <DisplayFiltersSelection
                layoutDisplayFiltersOptions={
                  activeLayout ? ISSUE_DISPLAY_FILTERS_BY_PAGE.team_issues[activeLayout] : undefined
                }
                displayFilters={issueFilters?.displayFilters ?? {}}
                handleDisplayFiltersUpdate={handleDisplayFilters}
                displayProperties={issueFilters?.displayProperties ?? {}}
                handleDisplayPropertiesUpdate={handleDisplayProperties}
              />
            </FiltersDropdown>
          </>
        ) : (
          <></>
        )}
        {canUserCreateIssue ? (
          <Button
            onClick={() => toggleCreateIssueModal(true, EIssuesStoreType.TEAM_VIEW, teamspaceProjectIds)}
            size="sm"
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
