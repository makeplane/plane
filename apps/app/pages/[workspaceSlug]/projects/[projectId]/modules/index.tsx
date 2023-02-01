import React from "react";

import { useRouter } from "next/router";
import useSWR from "swr";
import { PlusIcon, RectangleGroupIcon } from "@heroicons/react/24/outline";

// layouts
import AppLayout from "layouts/app-layout";
// lib
import { requiredAuth } from "lib/auth";
// services
import projectService from "services/project.service";
import modulesService from "services/modules.service";
// components
import SingleModuleCard from "components/project/modules/single-module-card";
// ui
import { EmptySpace, EmptySpaceItem, HeaderButton, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
// types
import { IModule } from "types/modules";
// fetch-keys
import type { NextPage, NextPageContext } from "next";
import { MODULE_LIST, PROJECT_DETAILS } from "constants/fetch-keys";

const ProjectModules: NextPage = () => {
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

  return (
    <AppLayout
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
        <HeaderButton
          Icon={PlusIcon}
          label="Add Module"
          onClick={() => {
            const e = new KeyboardEvent("keydown", {
              key: "m",
            });
            document.dispatchEvent(e);
          }}
        />
      }
    >
      {modules ? (
        modules.length > 0 ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {modules.map((module) => (
                <SingleModuleCard key={module.id} module={module} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center px-4">
            <EmptySpace
              title="You don't have any module yet."
              description="Modules are smaller, focused projects that help you group and organize issues within a specific time frame."
              Icon={RectangleGroupIcon}
            >
              <EmptySpaceItem
                title="Create a new module"
                description={
                  <span>
                    Use <pre className="inline rounded bg-gray-100 px-2 py-1">M</pre> shortcut to
                    create a new module
                  </span>
                }
                Icon={PlusIcon}
                action={() => {
                  const e = new KeyboardEvent("keydown", {
                    key: "m",
                  });
                  document.dispatchEvent(e);
                }}
              />
            </EmptySpace>
          </div>
        )
      ) : (
        <Loader className="grid grid-cols-3 gap-4">
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

export const getServerSideProps = async (ctx: NextPageContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);

  const redirectAfterSignIn = ctx.req?.url;

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

export default ProjectModules;
