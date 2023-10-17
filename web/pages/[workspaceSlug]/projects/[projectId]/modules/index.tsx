import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { NextPage } from "next";
// layouts
import { AppLayout } from "layouts/app-layout";
// hooks
import useUserAuth from "hooks/use-user-auth";
// services
import { ProjectService } from "services/project";
import { ModuleService } from "services/module.service";
// components
import { CreateUpdateModuleModal, ModulesListGanttChartView, SingleModuleCard } from "components/modules";
import { ModulesHeader } from "components/headers";
// ui
import { Loader } from "@plane/ui";
import { EmptyState } from "components/common";
// icons
import { Plus } from "lucide-react";
// images
import emptyModule from "public/empty-state/module.svg";
// types
import { IModule, SelectModuleType } from "types/modules";
// fetch-keys
import { MODULE_LIST, PROJECT_DETAILS } from "constants/fetch-keys";

// services
const projectService = new ProjectService();
const moduleService = new ModuleService();

const ProjectModules: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // states
  const [modulesView, setModulesView] = useState<"grid" | "gantt_chart">("grid");
  const [selectedModule, setSelectedModule] = useState<SelectModuleType>();
  const [createUpdateModule, setCreateUpdateModule] = useState(false);

  const { user } = useUserAuth();

  const { data: activeProject } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId ? () => projectService.getProject(workspaceSlug as string, projectId as string) : null
  );

  const { data: modules, mutate: mutateModules } = useSWR(
    workspaceSlug && projectId ? MODULE_LIST(projectId as string) : null,
    workspaceSlug && projectId ? () => moduleService.getModules(workspaceSlug as string, projectId as string) : null
  );

  const handleEditModule = (module: IModule) => {
    setSelectedModule({ ...module, actionType: "edit" });
    setCreateUpdateModule(true);
  };

  useEffect(() => {
    if (createUpdateModule) return;

    const timer = setTimeout(() => {
      setSelectedModule(undefined);
      clearTimeout(timer);
    }, 500);
  }, [createUpdateModule]);

  return (
    <AppLayout
      header={<ModulesHeader name={activeProject?.name} modulesView={modulesView} setModulesView={setModulesView} />}
    >
      <CreateUpdateModuleModal
        isOpen={createUpdateModule}
        setIsOpen={setCreateUpdateModule}
        data={selectedModule}
        user={user}
      />
      {modules ? (
        modules.length > 0 ? (
          <>
            {modulesView === "grid" && (
              <div className="h-full overflow-y-auto p-8">
                <div className="grid grid-cols-1 gap-9 lg:grid-cols-2 xl:grid-cols-3">
                  {modules.map((module) => (
                    <SingleModuleCard
                      key={module.id}
                      module={module}
                      handleEditModule={() => handleEditModule(module)}
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
        )
      ) : (
        <Loader className="grid grid-cols-3 gap-4 p-8">
          <Loader.Item height="100px" />
          <Loader.Item height="100px" />
          <Loader.Item height="100px" />
          <Loader.Item height="100px" />
          <Loader.Item height="100px" />
          <Loader.Item height="100px" />
        </Loader>
      )}
    </AppLayout>
  );
};

export default ProjectModules;
