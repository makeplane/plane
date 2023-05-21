import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// services
import projectService from "services/project.service";
import modulesService from "services/modules.service";
// components
import {
  CreateUpdateModuleModal,
  ModulesListGanttChartView,
  SingleModuleCard,
} from "components/modules";
// ui
import { EmptyState, Loader, PrimaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { ChartBarIcon, PlusIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
// images
import emptyModule from "public/empty-state/empty-module.svg";
// types
import { IModule, SelectModuleType } from "types/modules";
import type { NextPage } from "next";
// fetch-keys
import { MODULE_LIST, PROJECT_DETAILS } from "constants/fetch-keys";

const ProjectModules: NextPage = () => {
  const [selectedModule, setSelectedModule] = useState<SelectModuleType>();
  const [createUpdateModule, setCreateUpdateModule] = useState(false);

  const [modulesView, setModulesView] = useState<"grid" | "gantt_chart">("grid");

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: activeProject } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: modules } = useSWR<IModule[]>(
    workspaceSlug && projectId ? MODULE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => modulesService.getModules(workspaceSlug as string, projectId as string)
      : null
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
    <ProjectAuthorizationWrapper
      meta={{
        title: "Plane - Modules",
      }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`${activeProject?.name ?? "Project"} Modules`} />
        </Breadcrumbs>
      }
      right={
        <PrimaryButton
          className="flex items-center gap-2"
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "m" });
            document.dispatchEvent(e);
          }}
        >
          <PlusIcon className="h-4 w-4" />
          Add Module
        </PrimaryButton>
      }
    >
      <CreateUpdateModuleModal
        isOpen={createUpdateModule}
        setIsOpen={setCreateUpdateModule}
        data={selectedModule}
      />
      {modules ? (
        modules.length > 0 ? (
          <div className="space-y-5 p-8 flex flex-col h-full overflow-hidden">
            <div className="flex gap-4 justify-between">
              <h3 className="text-2xl font-semibold text-brand-base">Modules</h3>
              <div className="flex items-center gap-x-1">
                <button
                  type="button"
                  className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-brand-surface-2 ${
                    modulesView === "grid" ? "bg-brand-surface-2" : ""
                  }`}
                  onClick={() => setModulesView("grid")}
                >
                  <Squares2X2Icon className="h-4 w-4 text-brand-secondary" />
                </button>
                <button
                  type="button"
                  className={`grid h-7 w-7 place-items-center rounded outline-none duration-300 hover:bg-brand-surface-2 ${
                    modulesView === "gantt_chart" ? "bg-brand-surface-2" : ""
                  }`}
                  onClick={() => setModulesView("gantt_chart")}
                >
                  <span className="material-symbols-rounded text-brand-secondary text-[18px] rotate-90">
                    waterfall_chart
                  </span>
                </button>
              </div>
            </div>
            {modulesView === "grid" && (
              <div className="h-full overflow-y-auto">
                <div className="grid grid-cols-1 gap-9 sm:grid-cols-2 lg:grid-cols-3">
                  {modules.map((module) => (
                    <SingleModuleCard
                      key={module.id}
                      module={module}
                      handleEditModule={() => handleEditModule(module)}
                    />
                  ))}
                </div>
              </div>
            )}
            {modulesView === "gantt_chart" && <ModulesListGanttChartView modules={modules} />}
          </div>
        ) : (
          <EmptyState
            type="module"
            title="Create New Module"
            description="Modules are smaller, focused projects that help you group and organize issues within a specific time frame."
            imgURL={emptyModule}
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
    </ProjectAuthorizationWrapper>
  );
};

export default ProjectModules;
