import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
// hooks
import { useApplication, useEventTracker, useModule, useUser } from "hooks/store";
import useLocalStorage from "hooks/use-local-storage";
// components
import { ModuleCardItem, ModuleListItem, ModulePeekOverview, ModulesListGanttChartView } from "components/modules";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// ui
import { CycleModuleBoardLayout, CycleModuleListLayout, GanttLayoutLoader } from "components/ui";
// constants
import { EUserProjectRoles } from "constants/project";
import { MODULE_EMPTY_STATE_DETAILS } from "constants/empty-state";

export const ModulesListView: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, peekModule } = router.query;
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const { commandPalette: commandPaletteStore } = useApplication();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentProjectRole },
    currentUser,
  } = useUser();
  const { projectModuleIds, loader } = useModule();

  const { storedValue: modulesView } = useLocalStorage("modules_view", "grid");

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const EmptyStateImagePath = getEmptyStateImagePath("onboarding", "modules", isLightMode);

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

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
          title={MODULE_EMPTY_STATE_DETAILS["modules"].title}
          description={MODULE_EMPTY_STATE_DETAILS["modules"].description}
          image={EmptyStateImagePath}
          comicBox={{
            title: MODULE_EMPTY_STATE_DETAILS["modules"].comicBox.title,
            description: MODULE_EMPTY_STATE_DETAILS["modules"].comicBox.description,
          }}
          primaryButton={{
            text: MODULE_EMPTY_STATE_DETAILS["modules"].primaryButton.text,
            onClick: () => {
              setTrackElement("Module empty state");
              commandPaletteStore.toggleCreateModuleModal(true);
            },
          }}
          size="lg"
          disabled={!isEditingAllowed}
        />
      )}
    </>
  );
});
