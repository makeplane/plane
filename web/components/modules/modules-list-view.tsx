import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Plus } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// components
import { ModuleCardItem, ModuleListItem, ModulePeekOverview, ModulesListGanttChartView } from "components/modules";
import { EmptyState } from "components/common";
// ui
import { Loader } from "@plane/ui";
// assets
import emptyModule from "public/empty-state/empty_modules.webp";
import { NewEmptyState } from "components/common/new-empty-state";

export const ModulesListView: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, peekModule } = router.query;

  const { module: moduleStore, commandPalette: commandPaletteStore } = useMobxStore();

  const { storedValue: modulesView } = useLocalStorage("modules_view", "grid");

  const modulesList = moduleStore.projectModules;

  if (!modulesList)
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
      {modulesList.length > 0 ? (
        <>
          {modulesView === "list" && (
            <div className="h-full overflow-y-auto">
              <div className="flex justify-between h-full w-full">
                <div className="flex flex-col h-full w-full overflow-y-auto">
                  {modulesList.map((module) => (
                    <ModuleListItem key={module.id} module={module} />
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
              <div className="flex justify-between h-full w-full">
                <div
                  className={`grid grid-cols-1 gap-6 p-8 h-full w-full overflow-y-auto ${
                    peekModule
                      ? "lg:grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3"
                      : "lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4"
                  } auto-rows-max transition-all `}
                >
                  {modulesList.map((module) => (
                    <ModuleCardItem key={module.id} module={module} />
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
        <NewEmptyState
          title="Map your project milestones to Modules and track aggregated work easily."
          description="A group of issues that belong to a logical, hierarchical parent form a module. Think of them as a way to track work by project milestones. They have their own periods and deadlines as well as analytics to help you see how close or far you are from a milestone."
          image={emptyModule}
          comicBox={{
            title: "Modules help group work by hierarchy.",
            direction: "right",
            description:
              "A cart module, a chassis module, and a warehouse module are all good example of this grouping.",
          }}
          primaryButton={{
            icon: <Plus className="h-4 w-4" />,
            text: "Build your first module",
            onClick: () => commandPaletteStore.toggleCreateModuleModal(true),
          }}
        />
      )}
    </>
  );
});
