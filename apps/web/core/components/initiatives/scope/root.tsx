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
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { PlusIcon } from "@plane/propel/icons";
import type { TInitiativeScopeTab } from "@plane/types";
import { INITIATIVE_SCOPE_TABS } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local imports
import { InitiativeScopeFiltersToggle } from "./filters-toggle";
import { InitiativeScopeSharedProvider } from "./context-shared";
import { InitiativeScopeProjectFilterProvider } from "./projects/filters";
import { InitiativeScopeEpicsRoot } from "./epics/root";
import { InitiativeScopeProjectsRoot } from "./projects/root";
import type { TProjectProperty } from "@/store/project/permissions/root";
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";
import { useFavorite } from "@/hooks/store/use-favorite";

const TABS = [
  { id: "epics" as const, label: "Epics" },
  { id: "projects" as const, label: "Projects" },
] satisfies Array<{ id: TInitiativeScopeTab; label: string }>;

type Props = {
  workspaceSlug: string;
  initiativeId: string;
};

export const InitiativeScopeRoot = observer(function InitiativeScopeRoot(props: Props) {
  const { workspaceSlug, initiativeId } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { permissions: projectPermissions } = useProject();
  const {
    initiative: {
      scope: { getDisplayFilters, updateDisplayFilters },
      toggleEpicModal,
      toggleProjectsModal,
      permissions,
    },
  } = useInitiatives();
  const { permissions: favoritePermissions } = useFavorite();
  // derived values
  const displayFilters = getDisplayFilters(initiativeId?.toString());
  const activeTab = displayFilters?.activeTab ?? "epics";
  const scopePermissions = {
    canAddScope: permissions.getCanAddScope(workspaceSlug, initiativeId),
    canRemoveEpic: permissions.getCanRemoveEpic(workspaceSlug, initiativeId),
    canRemoveProject: permissions.getCanRemoveProject(workspaceSlug, initiativeId),
    canDragAndDropProject: false,
    canEditProject: (projectId: string) => permissions.getCanEditProject(workspaceSlug, initiativeId, projectId),
    canEditProjectProperty: (projectId: string, property: TProjectProperty) =>
      projectPermissions.getCanEditProperty(workspaceSlug, projectId, property),
    getProjectItemPermissions: (projectId: string) => ({
      ...projectPermissions.getProjectItemPermissions(workspaceSlug, projectId),
      canFavorite: favoritePermissions.getCanCreate(workspaceSlug),
    }),
    canEditEpic: (epicId: string) => permissions.getCanEditEpic(workspaceSlug, initiativeId, epicId),
    canEditEpicProperty: (epicId: string, property: TWorkItemProperty) =>
      permissions.getCanEditEpicProperty(workspaceSlug, initiativeId, epicId, property),
  };

  // Handle tab change
  const handleTabChange = (tab: TInitiativeScopeTab) => {
    if (!initiativeId) return;
    updateDisplayFilters(initiativeId.toString(), { activeTab: tab });
  };

  // Early return if required params are missing
  if (!workspaceSlug || !initiativeId) return null;

  const slug = workspaceSlug.toString();
  const id = initiativeId.toString();

  return (
    <InitiativeScopeSharedProvider workspaceSlug={slug} initiativeId={id} activeTab={activeTab}>
      <InitiativeScopeProjectFilterProvider workspaceSlug={slug} initiativeId={id}>
        <div className="flex flex-col h-full">
          {/* Tab row */}
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
                      activeTab === tab.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </button>
              ))}
            </div>
            <div className="flex-1" />
            {scopePermissions.canAddScope && (
              <Button
                variant="primary"
                size="lg"
                onClick={() =>
                  activeTab === INITIATIVE_SCOPE_TABS.EPICS
                    ? void toggleEpicModal(true, { workspaceSlug: slug, initiativeId: id })
                    : toggleProjectsModal(true)
                }
              >
                <PlusIcon className="size-3" />
                {activeTab === INITIATIVE_SCOPE_TABS.EPICS ? t("epic.add.label") : t("add_project")}
              </Button>
            )}
            <InitiativeScopeFiltersToggle initiativeId={id} />
          </div>

          {/* Entity root — mounts only the active tab's subtree */}
          <div className="relative h-full w-full overflow-hidden">
            {activeTab === INITIATIVE_SCOPE_TABS.EPICS ? (
              <InitiativeScopeEpicsRoot
                workspaceSlug={slug}
                initiativeId={id}
                permissions={scopePermissions}
                handleAddEpic={() => void toggleEpicModal(true, { workspaceSlug: slug, initiativeId: id })}
                handleAddProject={() => toggleProjectsModal(true)}
              />
            ) : (
              <InitiativeScopeProjectsRoot
                workspaceSlug={slug}
                initiativeId={id}
                permissions={scopePermissions}
                handleAddEpic={() => void toggleEpicModal(true, { workspaceSlug: slug, initiativeId: id })}
                handleAddProject={() => toggleProjectsModal(true)}
              />
            )}
          </div>
        </div>
      </InitiativeScopeProjectFilterProvider>
    </InitiativeScopeSharedProvider>
  );
});
