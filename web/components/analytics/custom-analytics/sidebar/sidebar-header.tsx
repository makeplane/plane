import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
import { renderShortDate } from "helpers/date-time.helper";
// constants
import { NETWORK_CHOICES } from "constants/project";

export const CustomAnalyticsSidebarHeader = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const { cycle: cycleStore, module: moduleStore, project: projectStore } = useMobxStore();

  const cycleDetails = cycleId ? cycleStore.getCycleById(cycleId.toString()) : undefined;
  const moduleDetails = moduleId ? moduleStore.getModuleById(moduleId.toString()) : undefined;
  const projectDetails =
    workspaceSlug && projectId
      ? projectStore.getProjectById(workspaceSlug.toString(), projectId.toString())
      : undefined;

  return (
    <>
      {projectId ? (
        cycleDetails ? (
          <div className="hidden md:block h-full overflow-y-auto">
            <h4 className="font-medium break-words">Analytics for {cycleDetails.name}</h4>
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2 text-xs">
                <h6 className="text-custom-text-200">Lead</h6>
                <span>{cycleDetails.owned_by?.display_name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <h6 className="text-custom-text-200">Start Date</h6>
                <span>
                  {cycleDetails.start_date && cycleDetails.start_date !== ""
                    ? renderShortDate(cycleDetails.start_date)
                    : "No start date"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <h6 className="text-custom-text-200">Target Date</h6>
                <span>
                  {cycleDetails.end_date && cycleDetails.end_date !== ""
                    ? renderShortDate(cycleDetails.end_date)
                    : "No end date"}
                </span>
              </div>
            </div>
          </div>
        ) : moduleDetails ? (
          <div className="hidden md:block h-full overflow-y-auto">
            <h4 className="font-medium break-words">Analytics for {moduleDetails.name}</h4>
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2 text-xs">
                <h6 className="text-custom-text-200">Lead</h6>
                <span>{moduleDetails.lead_detail?.display_name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <h6 className="text-custom-text-200">Start Date</h6>
                <span>
                  {moduleDetails.start_date && moduleDetails.start_date !== ""
                    ? renderShortDate(moduleDetails.start_date)
                    : "No start date"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <h6 className="text-custom-text-200">Target Date</h6>
                <span>
                  {moduleDetails.target_date && moduleDetails.target_date !== ""
                    ? renderShortDate(moduleDetails.target_date)
                    : "No end date"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex md:flex-col h-full overflow-y-auto">
            <div className="flex items-center gap-1">
              {projectDetails?.emoji ? (
                <div className="grid h-6 w-6 flex-shrink-0 place-items-center">{renderEmoji(projectDetails.emoji)}</div>
              ) : projectDetails?.icon_prop ? (
                <div className="h-6 w-6 grid place-items-center flex-shrink-0">
                  {renderEmoji(projectDetails.icon_prop)}
                </div>
              ) : (
                <span className="grid h-6 w-6 mr-1 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                  {projectDetails?.name.charAt(0)}
                </span>
              )}
              <h4 className="font-medium break-words">{projectDetails?.name}</h4>
            </div>
            <div className="space-y-4 mt-4">
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
