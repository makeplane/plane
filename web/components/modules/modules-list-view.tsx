import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
// hooks
import { useApplication, useModule, useUser } from "hooks/store";
import useLocalStorage from "hooks/use-local-storage";
// components
import { ModuleCardItem, ModuleListItem, ModulePeekOverview, ModulesListGanttChartView } from "components/modules";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// ui
import { Loader, Spinner } from "@plane/ui";
// constants
import { EUserProjectRoles } from "constants/project";

export const ModulesListView: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, peekModule } = router.query;
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const { commandPalette: commandPaletteStore } = useApplication();
  const {
    membership: { currentProjectRole },
    currentUser,
  } = useUser();
  const { projectModuleIds, loader } = useModule();

  const { storedValue: modulesView } = useLocalStorage("modules_view", "grid");

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const EmptyStateImagePath = getEmptyStateImagePath("onboarding", "modules", isLightMode);

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  if (loader)
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner />
      </div>
    );

  if (!projectModuleIds)
    return (
      <Loader className="grid grid-cols-3 gap-4 p-8">
        <Loader.Item height="176px" />
        <Loader.Item height="176px" />
        <Loader.Item height="176px" />
        <Loader.Item height="176px" />
        <Loader.Item height="176px" />
        <Loader.Item height="176px" />
      </Loader>
    );

  return (
    <>
      {projectModuleIds.length > 0 ? (
        <>
          {modulesView === "list" && (
            <div className="h-full overflow-y-auto">
              <div className="flex h-full w-full justify-between">
                <div className="flex h-full w-full flex-col overflow-y-auto">
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
                  } auto-rows-max transition-all `}
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
          title="Map your project milestones to Modules and track aggregated work easily."
          description="A group of issues that belong to a logical, hierarchical parent form a module. Think of them as a way to track work by project milestones. They have their own periods and deadlines as well as analytics to help you see how close or far you are from a milestone."
          image={EmptyStateImagePath}
          comicBox={{
            title: "Modules help group work by hierarchy.",
            description:
              "A cart module, a chassis module, and a warehouse module are all good example of this grouping.",
          }}
          primaryButton={{
            text: "Build your first module",
            onClick: () => commandPaletteStore.toggleCreateModuleModal(true),
          }}
          size="lg"
          disabled={!isEditingAllowed}
        />
      )}
    </>
  );
});
