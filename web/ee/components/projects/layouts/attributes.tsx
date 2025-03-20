import { SyntheticEvent } from "react";
import { observer } from "mobx-react";
import { CalendarCheck2, CalendarClock, Users } from "lucide-react";
// plane imports
import { EUserProjectRoles } from "@plane/constants";
import { IWorkspace } from "@plane/types";
import { Avatar, PriorityIcon, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { DateDropdown, MemberDropdown } from "@/components/dropdowns";
// helpers
import { renderFormattedPayloadDate, getDate } from "@/helpers/date-time.helper";
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useMember, useUserPermissions } from "@/hooks/store";
// plane web imports
import { TProject } from "@/plane-web/types/projects";
import { EProjectPriority } from "@/plane-web/types/workspace-project-states";
// local imports
import { StateDropdown, PriorityDropdown } from "../dropdowns";
import MembersDropdown from "../dropdowns/members-dropdown";
import { useTranslation } from "@plane/i18n";

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
  const projectMembersIds = project.members;

  const { getUserDetails } = useMember();
  const { t } = useTranslation();
  const lead = getUserDetails(project.project_lead as string);
  const { workspaceProjectsPermissions } = useUserPermissions();
  const isEditingAllowed =
    workspaceProjectsPermissions &&
    workspaceProjectsPermissions[workspaceSlug][project.id] &&
    workspaceProjectsPermissions[workspaceSlug][project.id] >= EUserProjectRoles.ADMIN;

  const handleEventPropagation = (e: SyntheticEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };
  return (
    <div className={cn("flex gap-2 flex-wrap p-4", containerClass)} data-prevent-nprogress>
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
          <DateDropdown
            value={project.start_date || null}
            onChange={(val) => {
              handleUpdateProject({
                start_date: val ? renderFormattedPayloadDate(val) : null,
                target_date: project.target_date,
              });
            }}
            placeholder={t("common.order_by.start_date")}
            icon={<CalendarClock className="h-3 w-3 flex-shrink-0" />}
            buttonVariant={project.start_date ? "border-with-text" : "border-without-text"}
            buttonContainerClassName={`h-5 w-full flex cursor-pointer items-center gap-1.5 text-custom-text-300 rounded text-xs`}
            optionsClassName="z-10"
            showTooltip
            maxDate={getDate(project.target_date)}
            disabled={!isEditingAllowed || isArchived}
          />
        </div>
      )}
      {displayProperties["date"] && (
        <div className="h-5 my-auto flex gap-2" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
          <DateDropdown
            value={project.target_date || null}
            onChange={(val) => {
              handleUpdateProject({
                start_date: project.start_date,
                target_date: val ? renderFormattedPayloadDate(val) : null,
              });
            }}
            placeholder={t("common.order_by.due_date")}
            icon={<CalendarCheck2 className="h-3 w-3 flex-shrink-0" />}
            buttonVariant={project.target_date ? "border-with-text" : "border-without-text"}
            buttonContainerClassName={`h-5 w-full flex cursor-pointer items-center gap-1.5 text-custom-text-300 rounded text-xs`}
            optionsClassName="z-10"
            showTooltip
            minDate={getDate(project.start_date)}
            disabled={!isEditingAllowed || isArchived}
          />
        </div>
      )}
      {cta}
    </div>
  );
});
export default Attributes;
