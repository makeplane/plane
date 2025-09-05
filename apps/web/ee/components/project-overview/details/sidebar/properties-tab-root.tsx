"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import { CalendarCheck2, CalendarClock, Signal, UserCircle2, Users } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { DoubleCircleIcon,InitiativeIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles } from "@plane/types";
import { Button } from "@plane/ui";
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
import { SidebarContentWrapper } from "@/plane-web/components/common/layout/sidebar/content-wrapper";
import { InitiativeMultiSelectModal } from "@/plane-web/components/initiatives/common/multi-select-modal";
import { MembersDropdown } from "@/plane-web/components/projects/dropdowns/members-dropdown";
import { PriorityDropdown } from "@/plane-web/components/projects/dropdowns/priority-dropdown";
import { StateDropdown } from "@/plane-web/components/projects/dropdowns/state-dropdown";
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TProject } from "@/plane-web/types";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
import { EProjectPriority } from "@/plane-web/types/workspace-project-states";
// assets
import ImagelLight from "@/public/empty-state/empty-updates-light.png";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectOverviewSidebarPropertiesRoot: FC<Props> = observer((props) => {
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
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300 my-auto">
                <DoubleCircleIcon className="h-4 w-4 flex-shrink-0" />
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
                  "text-custom-text-200 text-sm z-1 h-full p-2 w-full text-left border-none rounded group-[.selected-project-row]:bg-custom-primary-100/5 group-[.selected-project-row]:hover:bg-custom-primary-100/10"
                )}
              />
            </div>
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300 my-auto">
                <Signal className="h-4 w-4 flex-shrink-0" />
                <span>Priority</span>
              </div>
              <PriorityDropdown
                value={project.priority}
                onChange={(data: EProjectPriority | undefined) => handleUpdateProject({ priority: data })}
                buttonVariant="border-with-text"
                buttonClassName={cn(
                  "my-auto text-sm px-1 py-1 text-left rounded group-[.selected-project-row]:bg-custom-primary-100/5 group-[.selected-project-row]:hover:bg-custom-primary-100/10"
                )}
                showTooltip
                buttonContainerClassName="w-full"
                className="h-7 my-auto"
                disabled={!isEditingAllowed || isArchived}
              />
            </div>

            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                <UserCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>Lead</span>
              </div>
              {lead ? (
                <div className="w-full h-full flex items-center gap-1.5 rounded px-2 py-0.5 text-sm justify-between cursor-not-allowed">
                  <ButtonAvatars showTooltip userIds={lead.id} />
                  <span className="flex-grow truncate text-sm text-custom-text-200 leading-5">
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
                  button={<div className="px-2 text-custom-text-350 text-sm">None</div>}
                />
              )}
            </div>

            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>Members</span>
              </div>
              <MembersDropdown
                value={projectMembersIds ?? []}
                onChange={() => {}}
                className="h-7 my-auto w-full"
                buttonClassName="cursor-not-allowed"
                disabled
                button={
                  <div className="p-2 rounded text-sm text-custom-text-200 hover:bg-custom-background-80 justify-start flex items-start">
                    {projectMembersIds?.length} member(s)
                  </div>
                }
              />
            </div>
            {isInitiativesFeatureEnabled && (
              <div className="flex h-8 items-center gap-2">
                <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                  <InitiativeIcon className="h-4 w-4 flex-shrink-0" />
                  <span>Initiatives</span>
                </div>
                <Button
                  variant="link-neutral"
                  className={cn(
                    "p-2 rounded text-sm text-custom-text-200 hover:bg-custom-background-80 justify-start flex items-start w-full font-normal",
                    {
                      "text-custom-text-350": !project.initiative_ids?.length,
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
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                <CalendarClock className="h-4 w-4 flex-shrink-0" />
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
                buttonClassName={`text-sm ${project?.start_date ? "" : "text-custom-text-400"}`}
                hideIcon
                clearIconClassName="h-3 w-3 hidden group-hover:inline"
                maxDate={getDate(project.target_date) ?? undefined}
              />
            </div>
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-sm text-custom-text-300">
                <CalendarCheck2 className="h-4 w-4 flex-shrink-0" />
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
                buttonClassName={cn("text-sm text-custom-text-200", {
                  "text-custom-text-400": !project.target_date,
                })}
                hideIcon
                clearIconClassName="h-3 w-3 hidden group-hover:inline !text-custom-text-100"
                minDate={getDate(project.start_date) ?? undefined}
              />
            </div>
          </div>
        </SidebarContentWrapper>
      ) : (
        <div className="flex h-full">
          <div className="m-auto mt-[50%]">
            <Image src={ImagelLight} alt="No updates" className="w-[161px] m-auto" />
            <div className="w-fit m-auto text-lg font-medium items-center">Project Properties</div>
            <div className="w-fit m-auto font-medium text-base text-custom-text-350 text-center my-2">
              Enable project grouping to access this feature
            </div>
            <Link href={`/${workspaceSlug}/settings/project-states`} className="mt-4 mx-auto">
              <Button className="mx-auto"> Enable project grouping</Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
});
