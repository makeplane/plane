import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// lib
import { requiredAdmin, requiredAuth } from "lib/auth";

// services
import viewsService from "services/views.service";
import projectService from "services/project.service";

// layouts
import AppLayout from "layouts/app-layout";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";

//icons
import { PlusIcon } from "components/icons";

// image
import emptyView from "public/empty-state/empty-view.svg";
// fetching keys
import { PROJECT_DETAILS, VIEWS_LIST } from "constants/fetch-keys";
// components
import { PrimaryButton, Loader, EmptyState } from "components/ui";
import { DeleteViewModal, CreateUpdateViewModal, SingleViewItem } from "components/views";

// types
import { IView, UserAuth } from "types";
import type { NextPage, GetServerSidePropsContext } from "next";

const ProjectViews: NextPage<UserAuth> = (props) => {
  const [isCreateViewModalOpen, setIsCreateViewModalOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<IView | null>(null);

  const {
    query: { workspaceSlug, projectId },
  } = useRouter();

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
    <AppLayout
      meta={{
        title: "Plane - Views",
      }}
      memberType={props}
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
    </AppLayout>
  );
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);

  const redirectAfterSignIn = ctx.resolvedUrl;

  if (!user) {
    return {
      redirect: {
        destination: `/signin?next=${redirectAfterSignIn}`,
        permanent: false,
      },
    };
  }

  const projectId = ctx.query.projectId as string;
  const workspaceSlug = ctx.query.workspaceSlug as string;

  const memberDetail = await requiredAdmin(workspaceSlug, projectId, ctx.req?.headers.cookie);

  return {
    props: {
      isOwner: memberDetail?.role === 20,
      isMember: memberDetail?.role === 15,
      isViewer: memberDetail?.role === 10,
      isGuest: memberDetail?.role === 5,
    },
  };
};

export default ProjectViews;
