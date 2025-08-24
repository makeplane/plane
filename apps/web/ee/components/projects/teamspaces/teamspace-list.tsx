"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { Search } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles, EUserWorkspaceRoles } from "@plane/types";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
// ce imports
import type { TProjectTeamspaceList } from "@/ce/components/projects/teamspaces/teamspace-list";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useTeamspaces } from "@/plane-web/hooks/store";
// local imports
import { LinkTeamspaceToProjectModal } from "./link-teamspace-modal";
import { ProjectTeamspaceListLoader } from "./list-loader";
import { ProjectTeamspaceListItem } from "./teamspace-list-item";

export const ProjectTeamspaceList: React.FC<TProjectTeamspaceList> = observer((props) => {
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
    await addTeamspacesToProject(workspaceSlug, projectId, teamspaceIds)
      .then(() => {
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
      })
      .catch((error) => {
        console.error(error);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("teamspace_projects.settings.toast.add_teamspace.error.title"),
          message: t("teamspace_projects.settings.toast.add_teamspace.error.description"),
        });
      });
  };

  const renderHeader = () => (
    <div
      className={cn("flex items-center justify-between gap-4 py-2 overflow-x-hidden", {
        "border-b border-custom-border-100": isAnyTeamspaceLinked,
      })}
    >
      <div className="text-base font-semibold">{t("teamspaces.label")}</div>
      {isAnyTeamspaceLinked && (
        <>
          <div className="ml-auto flex items-center justify-start gap-1.5 rounded-md border border-custom-border-200 bg-custom-background-100 px-2 py-1">
            <Search className="h-3.5 w-3.5" />
            <input
              className="w-full max-w-[234px] border-none bg-transparent text-sm focus:outline-none placeholder:text-custom-text-400"
              placeholder={`${t("common.search.label")}`}
              value={searchQuery}
              autoFocus
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {hasPermissionToAddTeamspace && (
            <Button variant="primary" size="sm" onClick={() => setIsAddTeamspaceModalOpen(true)}>
              {t("teamspace_projects.settings.primary_button.text")}
            </Button>
          )}
        </>
      )}
    </div>
  );

  const renderEmptyState = () => (
    <div className="px-2 py-8 my-1 border border-custom-border-200 rounded-lg">
      <div className="flex flex-col items-center justify-center text-center gap-1">
        <span className="text-base font-semibold">
          {t("teamspace_projects.settings.empty_state.no_teamspaces.title")}
        </span>
        <span className="text-sm text-custom-text-300">
          {t("teamspace_projects.settings.empty_state.no_teamspaces.description")}{" "}
          <a
            href="https://docs.plane.so/core-concepts/workspaces/teamspaces"
            className="text-custom-primary-200 underline"
            target="_blank"
            rel="noreferrer"
          >
            {t("teamspace_projects.settings.secondary_button.text")}
          </a>
        </span>
        {hasPermissionToAddTeamspace && (
          <Button
            variant="accent-primary"
            size="sm"
            className="text-xs mt-2.5"
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
      <div className="divide-y divide-custom-border-100 overflow-scroll">
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
