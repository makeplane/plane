import { SyntheticEvent } from "react";
import { observer } from "mobx-react";
import { Users } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles, IWorkspace } from "@plane/types";
import { Avatar, PriorityIcon, Tooltip } from "@plane/ui";
import { cn, getDate, getFileURL, renderFormattedPayloadDate } from "@plane/utils";
// components
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
// hooks
import { useMember } from "@/hooks/store/use-member"
import { useUserPermissions } from "@/hooks/store/user";
import { TProject } from "@/plane-web/types/projects";
import { EProjectPriority } from "@/plane-web/types/workspace-project-states";
import { PriorityDropdown, StateDropdown } from "../dropdowns";
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
  displayProperties: { [key: string]: boolean };
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
    displayProperties,
  } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const { t } = useTranslation();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const lead = getUserDetails(project.project_lead as string);
  const projectMembersIds = project.members;
  const isEditingAllowed = allowPermissions(
    [EUserProjectRoles.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    project.id
  );

  const handleEventPropagation = (e: SyntheticEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };
  return (
    <div className={cn("flex gap-2 flex-wrap p-4", containerClass)} data-prevent-progress>
      {displayProperties["state"] && (
        <div className="h-5 my-auto" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
          <StateDropdown
            value={project.state_id || ""}
            onChange={(val) => handleUpdateProject({ state_id: val })}
            workspaceSlug={workspaceSlug.toString()}
            workspaceId={currentWorkspace.id}
            disabled={!isEditingAllowed || isArchived}
            optionsClassName="z-[11]"
            buttonClassName={cn(
              "z-1 h-5 px-2 py-0 text-left rounded group-[.selected-project-row]:bg-custom-primary-100/5 group-[.selected-project-row]:hover:bg-custom-primary-100/10"
            )}
          />
        </div>
      )}
      {displayProperties["priority"] && (
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
      )}
      {displayProperties["lead"] && (
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
            optionsClassName={"z-[11]"}
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
      )}
      {displayProperties["members"] && (
        <Tooltip tooltipContent="Members" position={"top"} className="ml-4">
          <div className="h-5 my-auto" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
            <MembersDropdown
              value={projectMembersIds ?? []}
              disabled
              onChange={() => {}}
              className="h-5 my-auto"
              buttonClassName="cursor-not-allowed"
            />
          </div>
        </Tooltip>
      )}
      {displayProperties["date"] && (
        <div className="h-5 my-auto flex gap-2" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
          <DateRangeDropdown
            value={{
              from: getDate(project.start_date) || undefined,
              to: getDate(project.target_date) || undefined,
            }}
            onSelect={(range) => {
              handleUpdateProject({
                start_date: range?.from ? renderFormattedPayloadDate(range.from) : null,
                target_date: range?.to ? renderFormattedPayloadDate(range.to) : null,
              });
            }}
            hideIcon={{
              from: false,
            }}
            isClearable
            mergeDates
            buttonVariant={project.start_date ? "border-with-text" : "border-without-text"}
            buttonContainerClassName={`h-5 w-full flex cursor-pointer items-center gap-1.5 text-custom-text-300 rounded text-xs`}
            showTooltip
            disabled={!isEditingAllowed || isArchived}
            renderPlaceholder={false}
          />
        </div>
      )}

      {cta}
    </div>
  );
});
export default Attributes;
