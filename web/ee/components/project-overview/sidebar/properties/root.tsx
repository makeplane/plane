import { observer } from "mobx-react";
import { CalendarCheck2, CalendarClock, Signal, UserCircle2, Users } from "lucide-react";
import { cn } from "@plane/editor";
import { IWorkspace } from "@plane/types";
import { DoubleCircleIcon } from "@plane/ui";
import { DateDropdown, MemberDropdown } from "@/components/dropdowns";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { renderFormattedPayloadDate, getDate } from "@/helpers/date-time.helper";
import { useMember, useUserPermissions } from "@/hooks/store";
import { EUserPermissions } from "@/plane-web/constants/user-permissions";
import { TProject } from "@/plane-web/types/projects";
import { EProjectPriority } from "@/plane-web/types/workspace-project-states";
import { PriorityDropdown, StateDropdown } from "../../../projects";
import MembersDropdown from "../../../projects/dropdowns/members-dropdown";

type Props = {
  project: TProject;
  isArchived: boolean;
  handleUpdateProject: (data: Partial<TProject>) => void;
  workspaceSlug: string;
  currentWorkspace: IWorkspace;
  dateClassname?: string;
  containerClass?: string;
  disabled?: boolean;
};
export const ProjectPropertiesSidebar: React.FC<Props> = observer((props) => {
  const { project, isArchived, handleUpdateProject, workspaceSlug, currentWorkspace, disabled = false } = props;
  const projectMembersIds = project.members?.map((member) => member.member_id);

  const { getUserDetails } = useMember();
  const lead = getUserDetails(project.project_lead as string);
  const { workspaceProjectsPermissions } = useUserPermissions();
  const isEditingAllowed =
    workspaceProjectsPermissions &&
    workspaceProjectsPermissions[workspaceSlug][project.id] &&
    workspaceProjectsPermissions[workspaceSlug][project.id] >= EUserPermissions.ADMIN;

  return (
    <div className={`mb-2 space-y-2.5 ${disabled ? "opacity-60" : ""}`}>
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
          <span>Assignees</span>
        </div>
        <MembersDropdown
          value={projectMembersIds}
          onChange={() => {}}
          className="h-7 my-auto w-full"
          buttonClassName="cursor-not-allowed"
          disabled
          button={
            <div className="p-2 rounded text-sm text-custom-text-200 hover:bg-custom-background-80 justify-start flex items-start">
              {projectMembersIds.length} member(s)
            </div>
          }
        />
      </div>

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
              start_date: val ? renderFormattedPayloadDate(val) : undefined,
            })
          }
          disabled={disabled}
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
              target_date: val ? renderFormattedPayloadDate(val) : undefined,
            })
          }
          disabled={disabled}
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
  );
});
