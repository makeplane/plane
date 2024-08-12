import { SyntheticEvent } from "react";
import { observer } from "mobx-react";
import { cn } from "@plane/editor";
import { IWorkspace } from "@plane/types";
import { Avatar, PriorityIcon, Tooltip } from "@plane/ui";
import { DateRangeDropdown, MemberDropdown } from "@/components/dropdowns";
import { EUserProjectRoles } from "@/constants/project";
import { renderFormattedPayloadDate, getDate } from "@/helpers/date-time.helper";
import { useMember, useUser } from "@/hooks/store";
import { TProject } from "@/plane-web/types/projects";
import { EProjectPriority } from "@/plane-web/types/workspace-project-states";
import { StateDropdown, PriorityDropdown } from "../../dropdowns";
import MembersDropdown from "../../dropdowns/members-dropdown";

type Props = {
  project: TProject;
  isArchived: boolean;
  handleUpdateProject: (data: Partial<TProject>) => void;
  workspaceSlug: string;
  currentWorkspace: IWorkspace;
};
const Attributes: React.FC<Props> = observer((props) => {
  const { project, isArchived, handleUpdateProject, workspaceSlug, currentWorkspace } = props;
  const projectMembersIds = project.members?.map((member) => member.member_id);

  const { getUserDetails } = useMember();
  const lead = getUserDetails(project.project_lead as string);
  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();
  const isEditingAllowed =
    currentWorkspaceAllProjectsRole &&
    currentWorkspaceAllProjectsRole[project.id] &&
    currentWorkspaceAllProjectsRole[project.id] >= EUserProjectRoles.ADMIN;

  const handleEventPropagation = (e: SyntheticEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };
  return (
    <div className="flex gap-2 mt-3 flex-wrap" data-prevent-nprogress>
      <div className="h-5" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
        <StateDropdown
          value={project.state_id || ""}
          onChange={(val) => handleUpdateProject({ state_id: val })}
          workspaceSlug={workspaceSlug.toString()}
          workspaceId={currentWorkspace.id}
          disabled={!isEditingAllowed || isArchived}
          buttonClassName={cn(
            "z-1 h-5 px-2 py-0 text-left rounded group-[.selected-project-row]:bg-custom-primary-100/5 group-[.selected-project-row]:hover:bg-custom-primary-100/10"
          )}
        />
      </div>
      <div className="h-5" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
        <PriorityDropdown
          value={project.priority}
          onChange={(data: EProjectPriority | undefined) => handleUpdateProject({ priority: data })}
          buttonVariant="border-with-text"
          buttonClassName={cn(
            "px-4 text-left rounded group-[.selected-project-row]:bg-custom-primary-100/5 group-[.selected-project-row]:hover:bg-custom-primary-100/10"
          )}
          buttonContainerClassName="w-full"
          className="h-5"
          disabled={!isEditingAllowed || isArchived}
          button={
            <PriorityIcon
              priority={project.priority}
              size={12}
              withContainer
              className={cn({
                "cursor-not-allowed": !isEditingAllowed,
              })}
            />
          }
        />
      </div>

      <div className="h-5" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
        <DateRangeDropdown
          buttonVariant="border-with-text"
          minDate={new Date()}
          value={{
            from: getDate(project.start_date),
            to: getDate(project.target_date),
          }}
          onSelect={(val) => {
            handleUpdateProject({
              start_date: val?.from ? renderFormattedPayloadDate(val.from)! : undefined,
              target_date: val?.to ? renderFormattedPayloadDate(val.to)! : undefined,
            });
          }}
          placeholder={{
            from: "Start date",
            to: "End date",
          }}
          hideIcon={{
            to: true,
          }}
          tabIndex={3}
          buttonClassName={cn("z-1 px-2 py-0 h-5")}
          className="h-5"
          disabled={!isEditingAllowed || isArchived}
        />
      </div>

      {lead && (
        <Tooltip tooltipContent="Lead" position={"bottom"} className="ml-4">
          <div className="h-5" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
            <MemberDropdown
              value={project.project_lead ? project.project_lead.toString() : null}
              onChange={(val) => handleUpdateProject({ project_lead: val })}
              placeholder="Lead"
              multiple={false}
              buttonVariant="border-with-text"
              tabIndex={5}
              buttonClassName="z-1 px-2 py-0 h-5"
              className="h-5"
              disabled={!isEditingAllowed || isArchived}
              button={
                <div
                  className={cn(
                    "h-full text-xs px-2 flex items-center gap-2 text-custom-text-200 border-[0.5px] border-custom-border-300 hover:bg-custom-background-80 rounded",
                    { "cursor-not-allowed": !isEditingAllowed }
                  )}
                >
                  <Avatar key={lead.id} name={lead.display_name} src={lead.avatar} size={14} className="text-[9px]" />
                  <div>{lead.first_name}</div>
                </div>
              }
            />
          </div>
        </Tooltip>
      )}

      {projectMembersIds.length > 0 && (
        <MembersDropdown
          value={projectMembersIds}
          disabled
          onChange={() => {}}
          className="h-5"
          buttonClassName="cursor-not-allowed"
        />
      )}
    </div>
  );
});
export default Attributes;
