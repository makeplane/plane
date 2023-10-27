import { observer } from "mobx-react-lite";
import { Plus } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// components
import { ModuleCardItem, ModulesListGanttChartView } from "components/modules";
import { EmptyState } from "components/common";
// ui
import { Loader } from "@plane/ui";
// assets
import emptyModule from "public/empty-state/module.svg";

export const ModulesListView: React.FC = observer(() => {
  const { module: moduleStore } = useMobxStore();

  const { storedValue: modulesView } = useLocalStorage("modules_view", "grid");

  const modulesList = moduleStore.projectModules;

  if (!modulesList)
    return (
      <Loader className="grid grid-cols-3 gap-4 p-8">
        <Loader.Item height="100px" />
        <Loader.Item height="100px" />
        <Loader.Item height="100px" />
        <Loader.Item height="100px" />
        <Loader.Item height="100px" />
        <Loader.Item height="100px" />
      </Loader>
    );

  return (
    <>
      {modulesList.length > 0 ? (
        <>
          {modulesView === "grid" && (
            <div className="h-full overflow-y-auto p-8">
              <div className="grid grid-cols-1 gap-9 lg:grid-cols-2 xl:grid-cols-3">
                {modulesList.map((module) => (
                  <ModuleCardItem key={module.id} module={module} />
                ))}
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
            onClick: () => {
              const e = new KeyboardEvent("keydown", {
                key: "m",
              });
              document.dispatchEvent(e);
            },
          }}
        />
      )}
    </>
  );
});
