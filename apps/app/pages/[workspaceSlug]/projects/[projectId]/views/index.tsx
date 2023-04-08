import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import viewsService from "services/views.service";
import projectService from "services/project.service";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
//icons
import { PlusIcon } from "components/icons";
// images
import emptyView from "public/empty-state/empty-view.svg";
// fetching keys
import { PROJECT_DETAILS, VIEWS_LIST } from "constants/fetch-keys";
// components
import { PrimaryButton, Loader, EmptyState } from "components/ui";
import { DeleteViewModal, CreateUpdateViewModal, SingleViewItem } from "components/views";
// types
import { IView } from "types";
import type { NextPage } from "next";

const ProjectViews: NextPage = () => {
  const [isCreateViewModalOpen, setIsCreateViewModalOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<IView | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: activeProject } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: views } = useSWR(
    workspaceSlug && projectId ? VIEWS_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => viewsService.getViews(workspaceSlug as string, projectId as string)
      : null
  );

  return (
    <ProjectAuthorizationWrapper
      meta={{
        title: "Plane - Views",
      }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`${activeProject?.name ?? "Project"} Views`} />
        </Breadcrumbs>
      }
      right={
        <div className="flex items-center gap-2">
          <PrimaryButton
            type="button"
            className="flex items-center gap-2"
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "v" });
              document.dispatchEvent(e);
            }}
          >
            <PlusIcon className="w-4 h-4" />
            Create View
          </PrimaryButton>
        </div>
      }
    >
      <CreateUpdateViewModal
        isOpen={isCreateViewModalOpen}
        handleClose={() => setIsCreateViewModalOpen(false)}
      />
      <DeleteViewModal
        isOpen={!!selectedView}
        data={selectedView}
        onClose={() => setSelectedView(null)}
        onSuccess={() => setSelectedView(null)}
      />
      {views ? (
        views.length > 0 ? (
          <div className="space-y-5">
            <h3 className="text-3xl font-semibold text-black">Views</h3>
            <div className="rounded-[10px] border">
              {views.map((view) => (
                <SingleViewItem key={view.id} view={view} setSelectedView={setSelectedView} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            type="view"
            title="Create New View"
            description="Views aid in saving your issues by applying various filters and grouping options."
            imgURL={emptyView}
          />
        )
      ) : (
        <Loader className="space-y-3">
          <Loader.Item height="30px" />
          <Loader.Item height="30px" />
          <Loader.Item height="30px" />
        </Loader>
      )}
    </ProjectAuthorizationWrapper>
  );
};

export default ProjectViews;
