import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { Logo } from "@/components/common";
// constants
import { NETWORK_CHOICES } from "@/constants/project";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { useCycle, useMember, useModule, useProject } from "@/hooks/store";

export const CustomAnalyticsSidebarHeader = observer(() => {
  const { projectId, cycleId, moduleId } = useParams();

  const { getProjectById } = useProject();
  const { getCycleById } = useCycle();
  const { getModuleById } = useModule();
  const { getUserDetails } = useMember();

  const cycleDetails = cycleId ? getCycleById(cycleId.toString()) : undefined;
  const moduleDetails = moduleId ? getModuleById(moduleId.toString()) : undefined;
  const projectDetails = projectId ? getProjectById(projectId.toString()) : undefined;
  const cycleOwnerDetails = cycleDetails ? getUserDetails(cycleDetails.owned_by_id) : undefined;
  const moduleLeadDetails = moduleDetails && moduleDetails.lead_id ? getUserDetails(moduleDetails.lead_id) : undefined;

  return (
    <>
      {projectId ? (
        cycleDetails ? (
          <div className="h-full overflow-y-auto">
            <h4 className="break-words font-medium">Analytics for {cycleDetails.name}</h4>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2 text-xs">
                <h6 className="text-custom-text-200">Lead</h6>
                <span>{cycleOwnerDetails?.display_name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <h6 className="text-custom-text-200">Start Date</h6>
                <span>
                  {cycleDetails.start_date && cycleDetails.start_date !== ""
                    ? renderFormattedDate(cycleDetails.start_date)
                    : "No start date"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <h6 className="text-custom-text-200">Target Date</h6>
                <span>
                  {cycleDetails.end_date && cycleDetails.end_date !== ""
                    ? renderFormattedDate(cycleDetails.end_date)
                    : "No end date"}
                </span>
              </div>
            </div>
          </div>
        ) : moduleDetails ? (
          <div className="h-full overflow-y-auto">
            <h4 className="break-words font-medium">Analytics for {moduleDetails.name}</h4>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2 text-xs">
                <h6 className="text-custom-text-200">Lead</h6>
                {moduleLeadDetails && <span>{moduleLeadDetails?.display_name}</span>}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <h6 className="text-custom-text-200">Start Date</h6>
                <span>
                  {moduleDetails.start_date && moduleDetails.start_date !== ""
                    ? renderFormattedDate(moduleDetails.start_date)
                    : "No start date"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <h6 className="text-custom-text-200">Target Date</h6>
                <span>
                  {moduleDetails.target_date && moduleDetails.target_date !== ""
                    ? renderFormattedDate(moduleDetails.target_date)
                    : "No end date"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="flex items-center gap-1">
              {projectDetails && (
                <span className="h-6 w-6 grid place-items-center flex-shrink-0">
                  <Logo logo={projectDetails.logo_props} />
                </span>
              )}
              <h4 className="break-words font-medium">{projectDetails?.name}</h4>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2 text-xs">
                <h6 className="text-custom-text-200">Network</h6>
                <span>{NETWORK_CHOICES.find((n) => n.key === projectDetails?.network)?.label ?? ""}</span>
              </div>
            </div>
          </div>
        )
      ) : null}
    </>
  );
});
