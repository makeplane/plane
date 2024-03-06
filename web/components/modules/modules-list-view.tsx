import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// hooks
import { useApplication, useEventTracker, useModule } from "hooks/store";
import useLocalStorage from "hooks/use-local-storage";
// components
import { ModuleCardItem, ModuleListItem, ModulePeekOverview, ModulesListGanttChartView } from "components/modules";
import { EmptyState } from "components/empty-state";
// ui
import { CycleModuleBoardLayout, CycleModuleListLayout, GanttLayoutLoader } from "components/ui";
// constants
import { EmptyStateType } from "constants/empty-state";

export const ModulesListView: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, peekModule } = router.query;
  // store hooks
  const { commandPalette: commandPaletteStore } = useApplication();
  const { setTrackElement } = useEventTracker();

  const { projectModuleIds, loader } = useModule();

  const { storedValue: modulesView } = useLocalStorage("modules_view", "grid");

  if (loader || !projectModuleIds)
    return (
      <>
        {modulesView === "list" && <CycleModuleListLayout />}
        {modulesView === "grid" && <CycleModuleBoardLayout />}
        {modulesView === "gantt_chart" && <GanttLayoutLoader />}
      </>
    );

  return (
    <>
      {projectModuleIds.length > 0 ? (
        <>
          {modulesView === "list" && (
            <div className="h-full overflow-y-auto">
              <div className="flex h-full w-full justify-between">
                <div className="flex h-full w-full flex-col overflow-y-auto vertical-scrollbar scrollbar-lg">
                  {projectModuleIds.map((moduleId) => (
                    <ModuleListItem key={moduleId} moduleId={moduleId} />
                  ))}
                </div>
                <ModulePeekOverview
                  projectId={projectId?.toString() ?? ""}
                  workspaceSlug={workspaceSlug?.toString() ?? ""}
                />
              </div>
            </div>
          )}
          {modulesView === "grid" && (
            <div className="h-full w-full">
              <div className="flex h-full w-full justify-between">
                <div
                  className={`grid h-full w-full grid-cols-1 gap-6 overflow-y-auto p-8 ${
                    peekModule
                      ? "lg:grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3"
                      : "lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4"
                  } auto-rows-max transition-all vertical-scrollbar scrollbar-lg`}
                >
                  {projectModuleIds.map((moduleId) => (
                    <ModuleCardItem key={moduleId} moduleId={moduleId} />
                  ))}
                </div>
                <ModulePeekOverview
                  projectId={projectId?.toString() ?? ""}
                  workspaceSlug={workspaceSlug?.toString() ?? ""}
                />
              </div>
            </div>
          )}
          {modulesView === "gantt_chart" && <ModulesListGanttChartView />}
        </>
      ) : (
        <EmptyState
          type={EmptyStateType.PROJECT_MODULE}
          primaryButtonOnClick={() => {
            setTrackElement("Module empty state");
            commandPaletteStore.toggleCreateModuleModal(true);
          }}
        />
      )}
    </>
  );
});
