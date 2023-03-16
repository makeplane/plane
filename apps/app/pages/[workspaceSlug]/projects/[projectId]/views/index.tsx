import React, { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import useSWR from "swr";

// lib
import { requiredAuth } from "lib/auth";

// services
import viewsService from "services/views.service";
import projectService from "services/project.service";

// layouts
import AppLayout from "layouts/app-layout";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { TrashIcon } from "@heroicons/react/20/solid";
// fetching keys
import { PROJECT_DETAILS, VIEWS_LIST } from "constants/fetch-keys";
// components
import { CustomMenu, Spinner } from "components/ui";
import { DeleteViewModal } from "components/views";
// types
import { IView } from "types";
import type { NextPage, GetServerSidePropsContext } from "next";

const ProjectViews: NextPage = () => {
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
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`${activeProject?.name ?? "Project"} Cycles`} />
        </Breadcrumbs>
      }
    >
      <DeleteViewModal
        isOpen={!!selectedView}
        data={selectedView}
        onClose={() => setSelectedView(null)}
        onSuccess={() => setSelectedView(null)}
      />
      <div className="rounded-md border border-gray-400">
        {views ? (
          views.map((view) => (
            <div
              className="flex items-center justify-between border-b border-gray-400 p-4 last:border-b-0"
              key={view.id}
            >
              <Link href={`/${workspaceSlug}/projects/${projectId}/views/${view.id}`}>
                <a>{view.name}</a>
              </Link>
              <CustomMenu width="auto" verticalEllipsis>
                <CustomMenu.MenuItem
                  onClick={() => {
                    setSelectedView(view);
                  }}
                >
                  <span className="flex items-center justify-start gap-2 text-gray-800">
                    <TrashIcon className="h-4 w-4" />
                    <span>Delete</span>
                  </span>
                </CustomMenu.MenuItem>
              </CustomMenu>
            </div>
          ))
        ) : (
          <div className="flex justify-center pt-20">
            <Spinner />
          </div>
        )}
      </div>
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

  return {
    props: {
      user,
    },
  };
};

export default ProjectViews;
