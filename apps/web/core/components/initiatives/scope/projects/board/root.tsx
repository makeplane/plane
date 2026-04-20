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

import { XCircle } from "lucide-react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useMemo } from "react";
// plane imports
import type { TIssuePriorities } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { PriorityIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TInitiativeScopeProjectGroupBy, TProjectStateIdsByGroup } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
// components
import { BaseKanbanLayout } from "@/components/base-layouts/kanban/layout";
import { InitiativeScopeProjectsEmptyState } from "@/components/issues/issue-layouts/empty-states/initiative-scope-project";
import { KanbanLayoutLoader } from "@/components/ui/loader/layouts/kanban-layout-loader";
import { ProjectStateIcon } from "@/components/workspace-project-states/project-state-icon";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TProject } from "@/types/projects";
import { Avatar } from "@plane/propel/avatar";
// components
import { ProjectCard } from "@/components/projects/list/with-grouping/layouts/gallery/card";
// store hooks
import type { ProjectItemPermissions } from "@/store/project/permissions/root";
// local imports
import { getProjectUpdatePayload, groupProjectsByProperty } from "./utils";
import type { IGroupDetailsHelpers } from "./utils";

type Props = {
  projectIds?: string[];
  workspaceSlug: string;
  initiativeId: string;
  permissions: {
    getProjectItemPermissions: (projectId: string) => ProjectItemPermissions;
    canDragAndDropProject: boolean;
    canRemoveProject: boolean;
  };
  isDataLoading?: boolean;
  groupBy: TInitiativeScopeProjectGroupBy;
};

export const InitiativeScopeProjectBoard = observer(function InitiativeScopeProjectBoard(props: Props) {
  const { projectIds = [], workspaceSlug, initiativeId, permissions, isDataLoading = false, groupBy } = props;

  // router
  const router = useAppRouter();
  const { workspaceSlug: routerWorkspaceSlug } = useParams();

  // hooks
  const { t } = useTranslation();
  const {
    initiative: {
      updateInitiative,
      getInitiativeById,
      scope: {
        projects: { fetchInitiativeProjects },
      },
    },
  } = useInitiatives();

  // store hooks
  const { getProjectById, updateProject } = useProject();
  const { currentWorkspace } = useWorkspace();
  const {
    isSettingsEnabled,
    getProjectStateIdsByWorkspaceId,
    getProjectStateById,
    getProjectStateIdsWithGroupingByWorkspaceId,
  } = useWorkspaceProjectStates();
  const {
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails },
  } = useMember();

  // derived values
  const slug = workspaceSlug || routerWorkspaceSlug?.toString() || "";
  const workspaceId = currentWorkspace?.id ?? "";
  const projectStateIds = getProjectStateIdsByWorkspaceId(workspaceId) ?? [];
  const projectStateIdsByGroup = getProjectStateIdsWithGroupingByWorkspaceId(workspaceId);

  const items: Record<string, TProject> = projectIds.reduce<Record<string, TProject>>((acc, id) => {
    const project = getProjectById(id);
    if (project) acc[id] = project;
    return acc;
  }, {});

  const groupHelpers: IGroupDetailsHelpers = useMemo(
    () => ({
      getProjectStateById: (stateId: string) => getProjectStateById(stateId),
      getMemberById: (memberId: string) => getWorkspaceMemberDetails(memberId)?.member,
      renderProjectStateIcon: (stateId: string) => {
        const state = getProjectStateById(stateId);
        return state ? <ProjectStateIcon projectStateGroup={state.group} width="14" height="14" /> : null;
      },
      renderPriorityIcon: (priority: string) => (
        <PriorityIcon priority={priority as TIssuePriorities} size={14} withContainer />
      ),
      renderMemberAvatar: (memberId: string) => {
        const member = getWorkspaceMemberDetails(memberId)?.member;
        return member ? (
          <Avatar name={member.display_name} src={member.avatar_url} size="sm" showTooltip={false} />
        ) : null;
      },
    }),
    [getProjectStateById, getWorkspaceMemberDetails]
  );

  const { groups, groupedItemIds } = groupProjectsByProperty(
    projectIds,
    getProjectById,
    groupBy,
    projectStateIds,
    projectStateIdsByGroup ?? {},
    workspaceMemberIds ?? [],
    groupHelpers
  );

  // Handle drop
  const handleDrop = async (
    sourceId: string,
    _destinationId: string | null,
    sourceGroupId: string,
    destinationGroupId: string
  ) => {
    if (sourceGroupId === destinationGroupId || !permissions.canDragAndDropProject) return;

    let payload = getProjectUpdatePayload(groupBy, destinationGroupId);

    if (groupBy === "state_groups" && projectStateIdsByGroup && projectStateIdsByGroup) {
      const destinationStateIds = projectStateIdsByGroup[destinationGroupId as keyof TProjectStateIdsByGroup];
      if (destinationStateIds && destinationStateIds.length > 0) {
        payload = { state_id: destinationStateIds[0] };
      } else {
        return;
      }
    }

    if (Object.keys(payload).length === 0) return;

    await updateProject(slug, sourceId, payload);
  };

  const canDrag = () => permissions.canDragAndDropProject && groupBy !== undefined && groupBy !== "state_groups";

  if (isDataLoading) {
    return <KanbanLayoutLoader />;
  }

  if (!isSettingsEnabled && (groupBy === "states" || groupBy === "state_groups")) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyStateCompact
          assetKey="state"
          title={t("initiatives.scope.board.enable_project_states")}
          description={t("initiatives.scope.board.enable_project_states_description")}
          align="center"
          rootClassName="py-20"
          actions={[
            {
              label: t("workspace_settings.settings.project_states.go_to_settings"),
              onClick: () => router.push(`/${slug}/settings/project-states`),
              variant: "primary",
            },
          ]}
        />
      </div>
    );
  }

  if (projectIds.length === 0) return <InitiativeScopeProjectsEmptyState />;

  return (
    <BaseKanbanLayout
      items={items}
      groups={groups}
      groupedItemIds={groupedItemIds}
      renderItem={(item: TProject, _groupId: string) => {
        const initiative = getInitiativeById(initiativeId);
        const removeItem: TContextMenuItem = {
          key: "remove-from-initiative",
          title: t("common.remove"),
          icon: XCircle,
          action: () =>
            updateInitiative(slug, initiativeId, {
              project_ids: initiative?.project_ids?.filter((id) => id !== item.id) ?? [],
            }).then(() => {
              fetchInitiativeProjects(slug, initiativeId);
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: "Success!",
                message: `You have removed the project ${item.name} from this initiative.`,
              });
            }),
          shouldRender: permissions.canRemoveProject,
        };
        return (
          <ProjectCard
            project={item}
            workspaceSlug={slug}
            permissions={permissions.getProjectItemPermissions(item.id)}
            hideArchiveDeleteModals
            detailsMenuVariant="scope"
            showJoinButton={false}
            hideLabels
            additionalMenuItems={[removeItem]}
          />
        );
      }}
      enableDragDrop={permissions.canDragAndDropProject && groupBy !== undefined && groupBy !== "state_groups"}
      onDrop={handleDrop}
      canDrag={canDrag}
      showEmptyGroups
      className="h-full"
    />
  );
});
