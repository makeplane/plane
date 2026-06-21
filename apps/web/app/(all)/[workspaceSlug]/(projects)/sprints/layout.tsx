/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router";
import { TabNavigationItem, TabNavigationList } from "@plane/propel/tab-navigation";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronDownIcon, CycleIcon } from "@plane/propel/icons";
import { MoreHorizontal, Settings } from "lucide-react";
import type { ICustomSearchSelectOption, TLogoProps } from "@plane/types";
import { CustomMenu, CustomSearchSelect, Header, Row } from "@plane/ui";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { SwitcherLabel } from "@/components/common/switcher-label";
import { AppSidebarToggleButton } from "@/components/sidebar/sidebar-toggle-button";
import { useWorkspaceSprint } from "@/hooks/store/use-workspace-sprint";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useSprintNavigationPreferences } from "@/hooks/use-navigation-preferences";
import { WorkspaceSprintsHeader, WorkspaceSprintsHeaderActions } from "./header";

const WorkspaceSprintsLayout = observer(function WorkspaceSprintsLayout() {
  const { sprintId, workspaceSprintId } = useParams();
  const { preferences: sprintPreferences } = useSprintNavigationPreferences();
  const hasSprintGroupContext = !!sprintId || !!workspaceSprintId;

  return (
    <>
      {!hasSprintGroupContext && sprintPreferences.navigationMode !== "TABBED" && (
        <AppHeader header={<WorkspaceSprintsHeader />} />
      )}
      <WorkspaceSprintsGroupNavigation />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
});

export default WorkspaceSprintsLayout;

const WorkspaceSprintsGroupNavigation = observer(function WorkspaceSprintsGroupNavigation() {
  const { workspaceSlug, sprintId, workspaceSprintId } = useParams();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed } = useAppTheme();
  const { preferences: sprintPreferences } = useSprintNavigationPreferences();
  const {
    currentWorkspaceSprintSquadIds,
    fetchWorkspaceSprintSquads,
    fetchWorkspaceSprints,
    getSprintSquadById,
    getSprintById,
    getSprintsBySquadId,
  } = useWorkspaceSprint();

  const workspaceSlugValue = workspaceSlug?.toString();
  const selectedSprintId = workspaceSprintId?.toString();
  const selectedSprint = selectedSprintId ? getSprintById(selectedSprintId) : undefined;
  const squadId = sprintId?.toString() ?? selectedSprint?.automation_id ?? undefined;
  const squad = squadId ? getSprintSquadById(squadId) : undefined;
  const sprintIds = squadId ? getSprintsBySquadId(squadId) : [];
  const manageHref = workspaceSlugValue && squadId ? `/${workspaceSlugValue}/sprints/${squadId}` : undefined;
  const firstSprintHref =
    workspaceSlugValue && sprintIds[0] ? `/${workspaceSlugValue}/sprints/work-items/${sprintIds[0]}` : undefined;
  const squadOptions = useMemo<ICustomSearchSelectOption[]>(
    () =>
      (currentWorkspaceSprintSquadIds ?? [])
        .map((id): ICustomSearchSelectOption | null => {
          const squadOption = getSprintSquadById(id);
          if (!squadOption) return null;

          return {
            value: id,
            query: squadOption.name,
            content: (
              <SwitcherLabel
                logo_props={squadOption.logo_props}
                name={squadOption.name}
                LabelIcon={CycleIcon}
                type="material"
              />
            ),
          };
        })
        .filter((option): option is ICustomSearchSelectOption => option !== null),
    [currentWorkspaceSprintSquadIds, getSprintSquadById]
  );

  const handleSquadChange = useCallback(
    (value: string) => {
      if (!workspaceSlugValue || value === squadId) return;
      navigate(`/${workspaceSlugValue}/sprints/${value}`);
    },
    [squadId, navigate, workspaceSlugValue]
  );

  useEffect(() => {
    if (!workspaceSlugValue) return;

    fetchWorkspaceSprintSquads(workspaceSlugValue);
    fetchWorkspaceSprints(workspaceSlugValue, squadId);
  }, [squadId, fetchWorkspaceSprintSquads, fetchWorkspaceSprints, workspaceSlugValue]);

  useEffect(() => {
    if (
      sprintPreferences.navigationMode !== "TABBED" ||
      !manageHref ||
      !firstSprintHref ||
      pathname !== manageHref ||
      new URLSearchParams(search).get("view") === "settings"
    )
      return;

    navigate(firstSprintHref, { replace: true });
  }, [firstSprintHref, manageHref, navigate, pathname, search, sprintPreferences.navigationMode]);

  if (!workspaceSlugValue || !squadId) return null;

  const settingsHref = `${manageHref}?view=settings`;
  const isSettingsPage = pathname === manageHref && new URLSearchParams(search).get("view") === "settings";
  const showSprintTabs = sprintPreferences.navigationMode === "TABBED";

  return (
    <div className="z-20">
      <Row className="flex h-11 w-full items-center gap-2 border-b border-subtle bg-surface-1">
        <div className="flex h-full w-full items-center gap-2 divide-x divide-subtle">
          <div className="flex size-full flex-1 items-center gap-2 overflow-hidden">
            {sidebarCollapsed && (
              <div className="shrink-0">
                <AppSidebarToggleButton />
              </div>
            )}
            <Header className="h-full overflow-hidden">
              <Header.LeftItem className="flex h-full max-w-full flex-nowrap items-center gap-3 overflow-hidden">
                <SprintAutomationSwitcher
                  automationName={squad?.name ?? "Squads"}
                  automationLogoProps={squad?.logo_props}
                  automationId={squadId}
                  automationOptions={squadOptions}
                  onChange={handleSquadChange}
                />
                <SprintAutomationActionsMenu onOpenSettings={() => navigate(settingsHref)} />
                {showSprintTabs && (
                  <>
                    <div className="h-5 w-1 shrink-0 border-l border-subtle" />
                    <TabNavigationList className="h-full min-w-0 overflow-hidden">
                      {sprintIds.map((id) => {
                        const sprint = getSprintById(id);
                        if (!sprint) return null;

                        const sprintHref = `/${workspaceSlugValue}/sprints/work-items/${sprint.id}`;

                        return (
                          <Link key={sprint.id} to={sprintHref}>
                            <TabNavigationItem isActive={!isSettingsPage && selectedSprintId === sprint.id}>
                              <span>{sprint.name}</span>
                            </TabNavigationItem>
                          </Link>
                        );
                      })}
                    </TabNavigationList>
                  </>
                )}
              </Header.LeftItem>
              <Header.RightItem className="shrink-0 items-center">
                <WorkspaceSprintsHeaderActions />
              </Header.RightItem>
            </Header>
          </div>
        </div>
      </Row>
    </div>
  );
});

type TSprintAutomationSwitcherProps = {
  automationName: string;
  automationLogoProps: TLogoProps | undefined;
  automationId: string | undefined;
  automationOptions: ICustomSearchSelectOption[];
  onChange: (value: string) => void;
};

function SprintAutomationSwitcher(props: TSprintAutomationSwitcherProps) {
  const { automationName, automationLogoProps, automationId, automationOptions, onChange } = props;

  return (
    <CustomSearchSelect
      options={automationOptions}
      value={automationId}
      onChange={onChange}
      customButton={
        <div className="group flex h-full max-w-48 cursor-pointer items-center gap-1 rounded-sm px-1 text-secondary outline-none hover:bg-surface-2">
          <SprintAutomationIcon automationLogoProps={automationLogoProps} />
          <span className="truncate text-13 font-medium">{automationName}</span>
          <ChevronDownIcon className="size-4 shrink-0 text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      }
      className="h-full rounded"
      customButtonClassName="h-full outline-none"
    />
  );
}

function SprintAutomationIcon({ automationLogoProps }: { automationLogoProps: TLogoProps | undefined }) {
  return automationLogoProps?.in_use ? (
    <Logo logo={automationLogoProps} size={16} type="material" />
  ) : (
    <CycleIcon className="size-4 shrink-0 text-tertiary" />
  );
}

type TSprintAutomationActionsMenuProps = {
  onOpenSettings: () => void;
};

function SprintAutomationActionsMenu(props: TSprintAutomationActionsMenuProps) {
  const { onOpenSettings } = props;

  return (
    <CustomMenu
      customButton={
        <span className="grid place-items-center rounded-sm p-0.5 text-placeholder hover:bg-layer-1">
          <MoreHorizontal className="size-4" />
        </span>
      }
      className="flex-shrink-0"
      customButtonClassName="grid place-items-center"
      placement="bottom-start"
      ariaLabel="Squad actions"
      useCaptureForOutsideClick
      closeOnSelect
    >
      <CustomMenu.MenuItem onClick={onOpenSettings}>
        <span className="flex items-center justify-start gap-2">
          <Settings className="h-3.5 w-3.5 stroke-[1.5]" />
          <span>Settings</span>
        </span>
      </CustomMenu.MenuItem>
    </CustomMenu>
  );
}
