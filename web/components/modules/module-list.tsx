import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// hooks
import useUserAuth from "hooks/use-user-auth";
// services
import modulesService from "services/modules.service";
// components
import { CreateUpdateModuleModal, ModulesListGanttChartView, ModuleDetailCard } from "components/modules";
// ui
import { EmptyState, Loader } from "components/ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// images
import emptyModule from "public/empty-state/module.svg";
// types
import type { IModule, SelectModuleType } from "types/modules";
// fetch-keys
import { MODULE_LIST } from "constants/fetch-keys";

type Props = {
  modulesView: string;
  modules?: IModule[] | null;
};

export const ModuleList: React.FC<Props> = (props) => {
  const { modulesView, modules } = props;

  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // states
  const [createUpdateModule, setCreateUpdateModule] = useState(false);
  const [selectedModule, setSelectedModule] = useState<SelectModuleType>();

  // hooks
  const { user } = useUserAuth();

  // TODO: remove this
  const { mutate: mutateModules } = useSWR(
    workspaceSlug && projectId ? MODULE_LIST(projectId as string) : null,
    workspaceSlug && projectId ? () => modulesService.getModules(workspaceSlug as string, projectId as string) : null
  );

  const handleEditModule = (module: IModule) => {
    setSelectedModule({ ...module, actionType: "edit" });
    setCreateUpdateModule(true);
  };

  /**
   * Close the create/update module
   * modal and reset the selected module
   */
  useEffect(() => {
    if (createUpdateModule) return;

    const timer = setTimeout(() => {
      setSelectedModule(undefined);
      clearTimeout(timer);
    }, 500);
  }, [createUpdateModule]);

  return (
    <>
      <CreateUpdateModuleModal
        isOpen={createUpdateModule}
        setIsOpen={setCreateUpdateModule}
        data={selectedModule}
        user={user}
      />

      {/* modules are loaded & there number is more than 0 */}
      {modules && modules.length > 0 && (
        <>
          {modulesView === "grid" && (
            <div className="h-full overflow-y-auto p-8">
              <div className="grid grid-cols-1 gap-9 lg:grid-cols-2 xl:grid-cols-3">
                {modules.map((moduleDetail) => (
                  <ModuleDetailCard
                    key={moduleDetail.id}
                    module={moduleDetail}
                    handleEditModule={() => handleEditModule(moduleDetail)}
                    user={user}
                  />
                ))}
              </div>
            </div>
          )}
          {modulesView === "gantt_chart" && (
            <ModulesListGanttChartView modules={modules} mutateModules={mutateModules} />
          )}
        </>
      )}

      {/* modules are still loading */}
      {!modules && (
        <Loader className="grid grid-cols-3 gap-4 p-8">
          <Loader.Item height="182px" />
          <Loader.Item height="182px" />
          <Loader.Item height="182px" />
          <Loader.Item height="182px" />
          <Loader.Item height="182px" />
          <Loader.Item height="182px" />
        </Loader>
      )}

      {/* modules are loaded & there number is 0 */}
      {modules && modules.length === 0 && (
        <EmptyState
          title="Manage your project with modules"
          description="Modules are smaller, focused projects that help you group and organize issues."
          image={emptyModule}
          primaryButton={{
            icon: <PlusIcon className="h-4 w-4" />,
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
};
