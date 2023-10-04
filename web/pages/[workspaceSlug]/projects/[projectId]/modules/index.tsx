import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// services
import projectService from "services/project.service";
// store
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ModuleList } from "components/modules";
// ui
import { Icon, PrimaryButton, Tooltip } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import type { NextPage } from "next";
// fetch-keys
import { MODULE_LIST, PROJECT_DETAILS } from "constants/fetch-keys";
// helper
import { replaceUnderscoreIfSnakeCase, truncateText } from "helpers/string.helper";

const moduleViewOptions = [
  {
    type: "gantt_chart",
    icon: "view_timeline",
  },
  {
    type: "grid",
    icon: "table_rows",
  },
] as const;

const ProjectModules: NextPage = () => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // store
  const { module: moduleStore } = useMobxStore();

  // states
  const [modulesView, setModulesView] = useState<"grid" | "gantt_chart">("grid");

  const { data: activeProject } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId ? () => projectService.getProject(workspaceSlug as string, projectId as string) : null
  );

  // TODO: remove + "tesings"
  useSWR(
    workspaceSlug && projectId ? MODULE_LIST(projectId.toString()) + "tesings" : null,
    workspaceSlug && projectId ? () => moduleStore.fetchModules(workspaceSlug.toString(), projectId.toString()) : null
  );

  const modules = moduleStore.modules[projectId?.toString()!];

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`${truncateText(activeProject?.name ?? "Project", 32)} Modules`} />
        </Breadcrumbs>
      }
      right={
        <div className="flex items-center gap-2">
          {moduleViewOptions.map((option) => (
            <Tooltip
              key={option.type}
              tooltipContent={<span className="capitalize">{replaceUnderscoreIfSnakeCase(option.type)} View</span>}
              position="bottom"
            >
              <button
                type="button"
                className={`grid h-7 w-7 place-items-center rounded p-1 outline-none hover:bg-custom-sidebar-background-80 duration-300 ${
                  modulesView === option.type ? "bg-custom-sidebar-background-80" : "text-custom-sidebar-text-200"
                }`}
                onClick={() => setModulesView(option.type)}
              >
                <Icon iconName={option.icon} className={`!text-base ${option.type === "grid" ? "rotate-90" : ""}`} />
              </button>
            </Tooltip>
          ))}
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
        </div>
      }
    >
      <ModuleList modulesView={modulesView} modules={modules} />
    </ProjectAuthorizationWrapper>
  );
};

export default observer(ProjectModules);
