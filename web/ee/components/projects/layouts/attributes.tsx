import { SyntheticEvent } from "react";
import { observer } from "mobx-react";
import { Users } from "lucide-react";
import { cn } from "@plane/editor";
import { IWorkspace } from "@plane/types";
import { Avatar, PriorityIcon, Tooltip } from "@plane/ui";
import { DateRangeDropdown, MemberDropdown } from "@/components/dropdowns";
import { renderFormattedPayloadDate, getDate } from "@/helpers/date-time.helper";
import { getFileURL } from "@/helpers/file.helper";
import { useMember, useUserPermissions } from "@/hooks/store";
import { EUserPermissions } from "@/plane-web/constants/user-permissions";
import { TProject } from "@/plane-web/types/projects";
import { EProjectPriority } from "@/plane-web/types/workspace-project-states";
import { StateDropdown, PriorityDropdown } from "../dropdowns";
import MembersDropdown from "../dropdowns/members-dropdown";

type Props = {
  project: TProject;
  isArchived: boolean;
  handleUpdateProject: (data: Partial<TProject>) => void;
  workspaceSlug: string;
  currentWorkspace: IWorkspace;
  cta?: React.ReactNode;
  dateClassname?: string;
  containerClass?: string;
};
const Attributes: React.FC<Props> = observer((props) => {
  const {
    project,
    isArchived,
    handleUpdateProject,
    workspaceSlug,
    currentWorkspace,
    cta,
    dateClassname,
    containerClass = "",
  } = props;
  const projectMembersIds = project.members?.map((member) => member.member_id);

  const { getUserDetails } = useMember();
  const lead = getUserDetails(project.project_lead as string);
  const { workspaceProjectsPermissions } = useUserPermissions();
  const isEditingAllowed =
    workspaceProjectsPermissions &&
    workspaceProjectsPermissions[workspaceSlug][project.id] &&
    workspaceProjectsPermissions[workspaceSlug][project.id] >= EUserPermissions.ADMIN;

  const handleEventPropagation = (e: SyntheticEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };
  return (
    <div className={cn("flex gap-2 flex-wrap p-4", containerClass)} data-prevent-nprogress>
      <div className="h-5 my-auto" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
        <StateDropdown
          value={project.state_id || ""}
          onChange={(val) => handleUpdateProject({ state_id: val })}
          workspaceSlug={workspaceSlug.toString()}
          workspaceId={currentWorkspace.id}
          disabled={!isEditingAllowed || isArchived}
          optionsClassName="z-[19]"
          buttonClassName={cn(
            "z-1 h-5 px-2 py-0 text-left rounded group-[.selected-project-row]:bg-custom-primary-100/5 group-[.selected-project-row]:hover:bg-custom-primary-100/10"
          )}
        />
      </div>
      <Tooltip tooltipContent="Priority" position={"top"} className="ml-4">
        <div className="h-5 my-auto" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
          <PriorityDropdown
            value={project.priority}
            onChange={(data: EProjectPriority | undefined) => handleUpdateProject({ priority: data })}
            buttonVariant="border-with-text"
            buttonClassName={cn(
              "px-4 text-left rounded group-[.selected-project-row]:bg-custom-primary-100/5 group-[.selected-project-row]:hover:bg-custom-primary-100/10"
            )}
            showTooltip
            buttonContainerClassName="w-full"
            className="h-5 my-auto"
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
      </Tooltip>
      <div className="h-5 my-auto" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
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
          button={
            lead ? (
              <Tooltip tooltipContent="Lead" position={"top"} className="ml-4">
                <div
                  className={cn(
                    "h-full text-xs px-2 flex items-center gap-2 text-custom-text-200 border-[0.5px] border-custom-border-300 hover:bg-custom-background-80 rounded",
                    { "cursor-not-allowed": !isEditingAllowed }
                  )}
                >
                  <Avatar
                    key={lead.id}
                    name={lead.display_name}
                    src={getFileURL(lead.avatar_url)}
                    size={14}
                    className="text-[9px]"
                  />
                  <div>{lead.first_name}</div>
                </div>
              </Tooltip>
            ) : (
              <Tooltip tooltipContent="Lead" position={"top"} className="ml-4">
                <div
                  className={cn(
                    "h-full text-xs px-2 flex items-center gap-2 text-custom-text-200 border-[0.5px] border-custom-border-300 hover:bg-custom-background-80 rounded",
                    { "cursor-not-allowed": !isEditingAllowed }
                  )}
                >
                  <Users className="h-3 w-3 flex-shrink-0" />
                  <div>Lead</div>
                </div>
              </Tooltip>
            )
          }
        />
      </div>
      <Tooltip tooltipContent="Members" position={"top"} className="ml-4">
        <div className="h-5 my-auto" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
          <MembersDropdown
            value={projectMembersIds}
            disabled
            onChange={() => {}}
            className="h-5 my-auto"
            buttonClassName="cursor-not-allowed"
          />
        </div>
      </Tooltip>
      <div className="h-5 my-auto" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
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
          className={cn("h-5 my-auto", dateClassname)}
          disabled={!isEditingAllowed || isArchived}
          showTooltip
        />
      </div>
      {cta}
    </div>
  );
});
export default Attributes;
