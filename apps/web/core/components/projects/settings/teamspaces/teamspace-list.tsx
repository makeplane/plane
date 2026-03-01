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

import { useState } from "react";
import { observer } from "mobx-react";
import { Search } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EUserProjectRoles, EUserWorkspaceRoles } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useTeamspaces } from "@/plane-web/hooks/store";
// local imports
import { LinkTeamspaceToProjectModal } from "./link-teamspace-modal";
import { ProjectTeamspaceListLoader } from "./list-loader";
import { ProjectTeamspaceListItem } from "./teamspace-list-item";

type TProjectTeamspaceList = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectTeamspaceList = observer(function ProjectTeamspaceList(props: TProjectTeamspaceList) {
  // props
  const { workspaceSlug, projectId } = props;
  // states
  const [isAddTeamspaceModalOpen, setIsAddTeamspaceModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { loader, isTeamspacesFeatureEnabled, getProjectTeamspaceIds, getTeamspaceById, addTeamspacesToProject } =
    useTeamspaces();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const linkedTeamspaceIds = getProjectTeamspaceIds(projectId);
  const isLoading = loader === "init-loader" || linkedTeamspaceIds === undefined;
  const isAnyTeamspaceLinked = !isLoading && linkedTeamspaceIds.length > 0;
  const filteredTeamspaceIds = (linkedTeamspaceIds ?? []).filter((teamspaceId) => {
    const teamspaceDetails = getTeamspaceById(teamspaceId);
    if (!teamspaceDetails) return false;
    return teamspaceDetails.name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  const hasWorkspaceAdminPermission = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const hasProjectAdminPermission = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
  // User needs to be a workspace admin and a project admin to add a teamspace
  const hasPermissionToAddTeamspace = hasWorkspaceAdminPermission && hasProjectAdminPermission;

  const handleLinkTeamspaceToProject = async (teamspaceIds: string[]) => {
    try {
      await addTeamspacesToProject(workspaceSlug, projectId, teamspaceIds);

      const totalTeamspaceCount = teamspaceIds.length;
      const firstTeamspaceName = getTeamspaceById(teamspaceIds[0])?.name;
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("teamspace_projects.settings.toast.add_teamspace.success.title", {
          count: totalTeamspaceCount,
        }),
        message: t("teamspace_projects.settings.toast.add_teamspace.success.description", {
          firstTeamspaceName,
          additionalCount: totalTeamspaceCount - 1,
        }),
      });
    } catch (error) {
      console.error(error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("teamspace_projects.settings.toast.add_teamspace.error.title"),
        message: t("teamspace_projects.settings.toast.add_teamspace.error.description"),
      });
    }
  };

  const renderHeader = () => (
    <div
      className={cn("flex items-center justify-between gap-4 py-2 overflow-x-hidden", {
        "border-b border-subtle": isAnyTeamspaceLinked,
      })}
    >
      <div className="text-body-sm-semibold">{t("teamspaces.label")}</div>
      {isAnyTeamspaceLinked && (
        <>
          <div className="ml-auto flex items-center justify-start gap-1.5 rounded-md border border-subtle-1 bg-surface-1 px-2 py-1">
            <Search className="h-3.5 w-3.5" />
            <input
              className="w-full max-w-[234px] border-none bg-transparent text-body-xs-regular focus:outline-none placeholder:text-placeholder"
              placeholder={`${t("common.search.label")}`}
              value={searchQuery}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {hasPermissionToAddTeamspace && (
            <Button variant="primary" size="lg" onClick={() => setIsAddTeamspaceModalOpen(true)}>
              {t("teamspace_projects.settings.primary_button.text")}
            </Button>
          )}
        </>
      )}
    </div>
  );

  const renderEmptyState = () => (
    <div className="px-2 py-8 my-1 border border-subtle-1 rounded-lg">
      <div className="flex flex-col items-center justify-center text-center gap-1">
        <span className="text-body-sm-semibold">
          {t("teamspace_projects.settings.empty_state.no_teamspaces.title")}
        </span>
        <span className="text-body-xs-regular text-tertiary">
          {t("teamspace_projects.settings.empty_state.no_teamspaces.description")}{" "}
          <a
            href="https://docs.plane.so/core-concepts/workspaces/teamspaces"
            className="text-accent-secondary underline"
            target="_blank"
            rel="noreferrer"
          >
            {t("teamspace_projects.settings.secondary_button.text")}
          </a>
        </span>
        {hasPermissionToAddTeamspace && (
          <Button
            variant="secondary"
            className="text-caption-sm-medium mt-2.5"
            onClick={() => setIsAddTeamspaceModalOpen(true)}
          >
            {t("teamspace_projects.settings.primary_button.text")}
          </Button>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return <ProjectTeamspaceListLoader />;
    }

    return (
      <div className="divide-y divide-subtle overflow-scroll">
        {isAnyTeamspaceLinked ? (
          <ProjectTeamspaceListItem
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            teamspaceIds={filteredTeamspaceIds}
          />
        ) : (
          renderEmptyState()
        )}
      </div>
    );
  };

  if (!isTeamspacesFeatureEnabled) return null;
  return (
    <>
      <LinkTeamspaceToProjectModal
        projectId={projectId}
        isOpen={isAddTeamspaceModalOpen}
        onClose={() => setIsAddTeamspaceModalOpen(false)}
        onSubmit={handleLinkTeamspaceToProject}
      />
      <div className="mb-6">
        {renderHeader()}
        {renderContent()}
      </div>
    </>
  );
});
