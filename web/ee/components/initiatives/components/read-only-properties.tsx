"use client";
import { observer } from "mobx-react";
import { ArrowRight, Briefcase, CalendarCheck2, CalendarDays, Users } from "lucide-react";
// plane imports
import { Avatar, EpicIcon, Logo } from "@plane/ui";
import { cn, renderFormattedDate } from "@plane/utils";
// helpers
import { getDate } from "@/helpers/date-time.helper";
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useMember, useProject } from "@/hooks/store";
// plane Web
import { TProject } from "@/plane-web/types";
import { TInitiative } from "@/plane-web/types/initiative";
// local components
import { PropertyBlockWrapper } from "./property-block-wrapper";

type Props = {
  initiative: TInitiative;
  isSidebarCollapsed: boolean | undefined;
};

export const ReadOnlyBlockProperties = observer((props: Props) => {
  const { initiative, isSidebarCollapsed } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const { getProjectById } = useProject();

  // derived values
  const lead = getUserDetails(initiative.lead ?? "");
  const startDate = getDate(initiative.start_date);
  const endDate = getDate(initiative.end_date);

  // helpers
  const getProjectIcon = (value: string | string[] | null) => {
    const renderIcon = (projectDetails: TProject) => (
      <span className="grid place-items-center flex-shrink-0 h-4 w-4">
        <Logo logo={projectDetails.logo_props} size={14} />
      </span>
    );
    if (Array.isArray(value)) {
      return (
        <div className="flex items-center gap-0.5">
          {value.length > 0 ? (
            value.map((projectId) => {
              const projectDetails = getProjectById(projectId);
              return projectDetails ? renderIcon(projectDetails) : null;
            })
          ) : (
            <Briefcase className="size-3 text-custom-text-300" />
          )}
        </div>
      );
    } else {
      const projectDetails = getProjectById(value);
      return projectDetails ? renderIcon(projectDetails) : null;
    }
  };

  const getProjectDisplayName = (value: string | string[] | null, placeholder: string = "") => {
    if (Array.isArray(value)) {
      const firstProject = getProjectById(value[0]);
      return value.length ? (value.length === 1 ? firstProject?.name : `${value.length} projects`) : placeholder;
    } else {
      return value ? (getProjectById(value)?.name ?? placeholder) : placeholder;
    }
  };

  const getEpicDisplayName = (value: string | string[] | null, placeholder: string = "") => {
    if (Array.isArray(value)) {
      return value.length ? `${value.length} epics` : placeholder;
    }
  };

  return (
    <div
      className={`relative flex flex-wrap ${isSidebarCollapsed ? "md:flex-grow md:flex-shrink-0" : "lg:flex-grow lg:flex-shrink-0"} items-center gap-2 whitespace-nowrap`}
    >
      {/* dates */}
      <PropertyBlockWrapper>
        <span className={cn("h-full flex items-center justify-center gap-1 rounded-sm flex-grow")}>
          {<CalendarDays className="h-3 w-3 flex-shrink-0" />}
          {startDate ? renderFormattedDate(startDate) : ""}
        </span>
        <ArrowRight className="h-3 w-3 flex-shrink-0" />
        <span className={cn("h-full flex items-center justify-center gap-1 rounded-sm flex-grow")}>
          {!initiative.end_date && <CalendarCheck2 className="h-3 w-3 flex-shrink-0" />}
          {endDate ? renderFormattedDate(endDate) : ""}
        </span>
      </PropertyBlockWrapper>

      {/*  lead */}
      <PropertyBlockWrapper>
        {lead ? (
          <>
            <Avatar
              key={lead.id}
              name={lead.display_name}
              src={getFileURL(lead.avatar_url)}
              size={14}
              className="text-[9px]"
            />
            <div>{lead.first_name}</div>
          </>
        ) : (
          <>
            <Users className="h-3 w-3 flex-shrink-0" />
            <div>Lead</div>
          </>
        )}
      </PropertyBlockWrapper>

      {/* projects */}
      <PropertyBlockWrapper>
        {getProjectIcon(initiative.project_ids || [])}
        <span className="flex-grow truncate max-w-40">
          {getProjectDisplayName(initiative.project_ids || [], "Project")}
        </span>
      </PropertyBlockWrapper>

      {/* epics */}
      <PropertyBlockWrapper>
        <EpicIcon className="h-4 w-4 text-custom-text-300" />
        <span className="flex-grow truncate max-w-40">{getEpicDisplayName(initiative.epic_ids || [], "Epic")}</span>
      </PropertyBlockWrapper>
    </div>
  );
});
