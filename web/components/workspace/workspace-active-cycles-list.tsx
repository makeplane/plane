import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import useSWR from "swr";
// components
import { ActiveCycleInfo } from "components/cycles";
// services
import { CycleService } from "services/cycle.service";
const cycleService = new CycleService();
// hooks
import { useWorkspace } from "hooks/store";
// helpers
import { renderEmoji } from "helpers/emoji.helper";

export const WorkspaceActiveCyclesList = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // fetching active cycles in workspace
  const { data } = useSWR("WORKSPACE_ACTIVE_CYCLES", () => cycleService.workspaceActiveCycles(workspaceSlug as string));
  // store
  const { workspaceActiveCyclesSearchQuery } = useWorkspace();
  // filter cycles based on search query
  const filteredCycles = data?.filter(
    (cycle) =>
      cycle.project_detail.name.toLowerCase().includes(workspaceActiveCyclesSearchQuery.toLowerCase()) ||
      cycle.project_detail.identifier?.toLowerCase().includes(workspaceActiveCyclesSearchQuery.toLowerCase()) ||
      cycle.name.toLowerCase().includes(workspaceActiveCyclesSearchQuery.toLowerCase())
  );

  return (
    <div>
      {workspaceSlug &&
        filteredCycles &&
        filteredCycles.map((cycle) => (
          <div key={cycle.id} className="px-5 py-7">
            <div className="flex items-center gap-1.5 px-3 py-1.5">
              {cycle.project_detail.emoji ? (
                <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                  {renderEmoji(cycle.project_detail.emoji)}
                </span>
              ) : cycle.project_detail.icon_prop ? (
                <div className="grid h-7 w-7 flex-shrink-0 place-items-center">
                  {renderEmoji(cycle.project_detail.icon_prop)}
                </div>
              ) : (
                <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                  {cycle.project_detail?.name.charAt(0)}
                </span>
              )}
              <h2 className="text-xl font-semibold">{cycle.project_detail.name}</h2>
            </div>
            <ActiveCycleInfo workspaceSlug={workspaceSlug?.toString()} projectId={cycle.project} cycle={cycle} />
          </div>
        ))}
    </div>
  );
});
