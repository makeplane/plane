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

import type { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import Link from "next/link";
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import {
  DueDatePropertyIcon,
  InitiativeIcon,
  MembersPropertyIcon,
  PriorityPropertyIcon,
  StartDatePropertyIcon,
  StatePropertyIcon,
  UserCirclePropertyIcon,
} from "@plane/propel/icons";
import { EUserProjectRoles } from "@plane/types";
// components
import { cn, getDate, renderFormattedPayloadDate } from "@plane/utils";
import { DateDropdown } from "@/components/dropdowns/date";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web
import { SidebarContentWrapper } from "@/components/common/layout/sidebar/content-wrapper";
import { InitiativeMultiSelectModal } from "@/components/initiatives/common/multi-select-modal";
import { MembersDropdown } from "@/components/projects/dropdowns/members";
import { PriorityDropdown } from "@/components/projects/dropdowns/priority";
import { StateDropdown } from "@/components/projects/dropdowns/state";
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TProject } from "@/types";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
import type { EProjectPriority } from "@/types/workspace-project-states";
// assets

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectOverviewSidebarPropertiesRoot = observer(function ProjectOverviewSidebarPropertiesRoot(
  props: Props
) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { getProjectById, updateProject } = useProject();
  const { allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { getUserDetails } = useMember();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const {
    initiative: { isInitiativeModalOpen, isInitiativesFeatureEnabled, toggleInitiativeModal },
  } = useInitiatives();
  const { t } = useTranslation();
  // derived values
  const project = getProjectById(projectId.toString());

  if (!project || !currentWorkspace) return null;

  // derived values
  const isArchived = project.archived_at !== null;
  const lead = getUserDetails(project.project_lead as string);
  const projectMembersIds = project.members;

  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) &&
    useFlag(workspaceSlug.toString(), "PROJECT_GROUPING");

  const isEditingAllowed = allowPermissions(
    [EUserProjectRoles.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  // handlers
  const handleUpdateProject = async (data: Partial<TProject>) => {
    await updateProject(workspaceSlug.toString(), projectId.toString(), data);
  };

  return (
    <>
      <InitiativeMultiSelectModal
        isOpen={isInitiativeModalOpen === projectId}
        onClose={() => toggleInitiativeModal()}
        selectedInitiativeIds={project.initiative_ids ?? []}
        onSubmit={(initiativeIds) => handleUpdateProject({ initiative_ids: initiativeIds })}
      />
      {isProjectGroupingEnabled ? (
        <SidebarContentWrapper title="Properties">
          <div className={`mb-2 space-y-2.5 ${!isEditingAllowed ? "opacity-60" : ""}`}>
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary my-auto">
                <StatePropertyIcon className="h-4 w-4 flex-shrink-0" />
                <span>State</span>
              </div>
              <StateDropdown
                value={project.state_id || ""}
                onChange={(val) => handleUpdateProject({ state_id: val })}
                workspaceSlug={workspaceSlug.toString()}
                workspaceId={currentWorkspace.id}
                disabled={!isEditingAllowed || isArchived}
                optionsClassName="z-[11]"
                className="w-full"
                labelIconSize="16"
                buttonClassName={cn(
                  "text-secondary text-13 z-1 h-full p-2 w-full text-left border-none rounded-sm group-[.selected-project-row]:bg-accent-primary/5 group-[.selected-project-row]:hover:bg-accent-primary/10"
                )}
              />
            </div>
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary my-auto">
                <PriorityPropertyIcon className="h-4 w-4 flex-shrink-0" />
                <span>Priority</span>
              </div>
              <PriorityDropdown
                value={project.priority}
                onChange={(data: EProjectPriority | undefined) => handleUpdateProject({ priority: data })}
                buttonVariant="border-with-text"
                buttonClassName={cn(
                  "my-auto text-13 px-1 py-1 text-left rounded-sm group-[.selected-project-row]:bg-accent-primary/5 group-[.selected-project-row]:hover:bg-accent-primary/10"
                )}
                showTooltip
                buttonContainerClassName="w-full"
                className="h-7 my-auto"
                disabled={!isEditingAllowed || isArchived}
              />
            </div>

            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary">
                <UserCirclePropertyIcon className="h-4 w-4 flex-shrink-0" />
                <span>Lead</span>
              </div>
              {lead ? (
                <div className="w-full h-full flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-13 justify-between cursor-not-allowed">
                  <ButtonAvatars showTooltip userIds={lead.id} />
                  <span className="flex-grow truncate text-13 text-secondary leading-5">
                    {lead ? lead.display_name : null}
                  </span>
                </div>
              ) : (
                <MemberDropdown
                  value={project.project_lead ? project.project_lead.toString() : null}
                  onChange={(val) => handleUpdateProject({ project_lead: project.project_lead === val ? null : val })}
                  placeholder="Lead"
                  multiple={false}
                  buttonVariant="border-with-text"
                  tabIndex={5}
                  buttonClassName="z-1 px-2 py-0 h-5"
                  className="h-5 my-auto"
                  projectId={project.id}
                  disabled={!isEditingAllowed || isArchived}
                  showTooltip
                  optionsClassName={"z-[11]"}
                  button={<div className="px-2 text-tertiary text-13">None</div>}
                />
              )}
            </div>

            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary">
                <MembersPropertyIcon className="h-4 w-4 flex-shrink-0" />
                <span>Members</span>
              </div>
              <MembersDropdown
                value={projectMembersIds ?? []}
                onChange={() => {}}
                className="h-7 my-auto w-full"
                buttonClassName="cursor-not-allowed"
                disabled
                button={
                  <div className="p-2 rounded-sm text-13 text-secondary hover:bg-layer-1 justify-start flex items-start">
                    {projectMembersIds?.length} member(s)
                  </div>
                }
              />
            </div>
            {isInitiativesFeatureEnabled && (
              <div className="flex h-8 items-center gap-2">
                <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary">
                  <InitiativeIcon className="h-4 w-4 flex-shrink-0" />
                  <span>Initiatives</span>
                </div>
                <Button
                  variant="ghost"
                  className={cn(
                    "p-2 rounded-sm text-13 text-secondary hover:bg-layer-1 justify-start flex items-start w-full font-normal",
                    {
                      "text-tertiary": !project.initiative_ids?.length,
                    }
                  )}
                  onClick={() => toggleInitiativeModal(projectId)}
                  disabled={!isEditingAllowed || isArchived}
                >
                  {project.initiative_ids?.length
                    ? t("initiatives.placeholder", { count: project.initiative_ids?.length })
                    : t("initiatives.add_initiative")}
                </Button>
              </div>
            )}
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary">
                <StartDatePropertyIcon className="h-4 w-4 flex-shrink-0" />
                <span>Start date</span>
              </div>
              <DateDropdown
                placeholder="None"
                value={getDate(project.start_date) ?? null}
                onChange={(val) =>
                  handleUpdateProject({
                    start_date: val ? renderFormattedPayloadDate(val) : null,
                  })
                }
                disabled={!isEditingAllowed || isArchived}
                buttonVariant="transparent-with-text"
                className="group w-3/5 flex-grow"
                buttonContainerClassName="w-full text-left"
                buttonClassName={`text-13 ${project?.start_date ? "" : "text-placeholder"}`}
                hideIcon
                clearIconClassName="h-3 w-3 hidden group-hover:inline"
                maxDate={getDate(project.target_date) ?? undefined}
              />
            </div>
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary">
                <DueDatePropertyIcon className="h-4 w-4 flex-shrink-0" />
                <span>Due date</span>
              </div>
              <DateDropdown
                placeholder="None"
                value={project.target_date ?? null}
                onChange={(val) =>
                  handleUpdateProject({
                    target_date: val ? renderFormattedPayloadDate(val) : null,
                  })
                }
                disabled={!isEditingAllowed || isArchived}
                buttonVariant="transparent-with-text"
                className="group w-3/5 flex-grow"
                buttonContainerClassName="w-full text-left"
                buttonClassName={cn("text-13 text-secondary", {
                  "text-placeholder": !project.target_date,
                })}
                hideIcon
                clearIconClassName="h-3 w-3 hidden group-hover:inline !text-primary"
                minDate={getDate(project.start_date) ?? undefined}
              />
            </div>
          </div>
        </SidebarContentWrapper>
      ) : (
        <EmptyStateCompact
          assetKey="state-square"
          title={t("workspace_empty_state.project_overview_state_sidebar.title")}
          description={t("workspace_empty_state.project_overview_state_sidebar.description")}
          customButton={
            <Link href={`/${workspaceSlug}/settings/project-states`} className="mt-4 mx-auto">
              <Button variant="primary">Enable</Button>
            </Link>
          }
          className="px-10"
        />
      )}
    </>
  );
});
