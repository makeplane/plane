import React, { useState } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
import type { NextPage } from "next";
// services
import projectService from "services/project.service";
// hooks
import useProjects from "hooks/use-projects";
import useWorkspaces from "hooks/use-workspaces";
import useUserAuth from "hooks/use-user-auth";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// ui
import { Icon, PrimaryButton } from "components/ui";
import { Breadcrumbs, BreadcrumbItem } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// helper
import { truncateText } from "helpers/string.helper";
// lib
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { ProjectCardList } from "components/project";

const ProjectsPage: NextPage = () => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store
  const { project: projectStore } = useMobxStore();
  // context data
  const { activeWorkspace } = useWorkspaces();

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(activeWorkspace?.name ?? "Workspace", 32)} Projects`}
            unshrinkTitle={false}
          />
        </Breadcrumbs>
      }
      right={
        <div className="flex items-center gap-3">
          <div className="flex w-full gap-1 items-center justify-start rounded-md px-2 py-1.5 border border-custom-border-300 bg-custom-background-90">
            <Icon iconName="search" className="!text-xl !leading-5 !text-custom-sidebar-text-400" />
            <input
              className="w-full  border-none bg-transparent text-xs text-custom-text-200 focus:outline-none"
              value={projectStore.searchQuery}
              onChange={(e) => projectStore.setSearchQuery(e.target.value)}
              placeholder="Search"
            />
          </div>

          <PrimaryButton
            className="flex items-center gap-2 flex-shrink-0"
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "p" });
              document.dispatchEvent(e);
            }}
          >
            <PlusIcon className="h-4 w-4" />
            Add Project
          </PrimaryButton>
        </div>
      }
    >
      {workspaceSlug && <ProjectCardList workspaceSlug={workspaceSlug.toString()} />}
    </WorkspaceAuthorizationLayout>
  );
};

export default ProjectsPage;
