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
import emptyModule from "public/empty-state/module.svg";

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
        <EmptyState
          title="Manage your project with modules"
          description="Modules are smaller, focused projects that help you group and organize issues."
          image={emptyModule}
          primaryButton={{
            icon: <Plus className="h-4 w-4" />,
            text: "New Module",
            onClick: () => commandPaletteStore.toggleCreateModuleModal(true),
          }}
        />
      )}
    </>
  );
});
