import React from "react";
// next
import type { NextPage, NextPageContext } from "next";
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// layouts
import AppLayout from "layouts/app-layout";
// lib
import { requiredAuth } from "lib/auth";
// services
import modulesService from "lib/services/modules.service";
// hooks
import useUser from "lib/hooks/useUser";
// components
import SingleModuleCard from "components/project/modules/single-module-card";
// ui
import { BreadcrumbItem, Breadcrumbs, EmptySpace, EmptySpaceItem, HeaderButton, Loader } from "ui";
// icons
import { PlusIcon, RectangleGroupIcon } from "@heroicons/react/24/outline";
// types
import { IModule } from "types/modules";
// fetch-keys
import { MODULE_LIST } from "constants/fetch-keys";

const ProjectModules: NextPage = () => {
  const { activeWorkspace, activeProject } = useUser();

  const router = useRouter();
  const { projectId } = router.query;

  const { data: modules } = useSWR<IModule[]>(
    activeWorkspace && projectId ? MODULE_LIST(projectId as string) : null,
    activeWorkspace && projectId
      ? () => modulesService.getModules(activeWorkspace.slug, projectId as string)
      : null
  );

  console.log(modules);

  return (
    <AppLayout
      meta={{
        title: "Plane - Modules",
      }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link="/projects" />
          <BreadcrumbItem title={`${activeProject?.name ?? "Project"} Modules`} />
        </Breadcrumbs>
      }
      right={
        <HeaderButton
          Icon={PlusIcon}
          label="Add Module"
          onClick={() => {
            const e = new KeyboardEvent("keydown", {
              ctrlKey: true,
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
            <div className="grid grid-cols-3 gap-2">
              {modules.map((module) => (
                <SingleModuleCard key={module.id} module={module} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center px-4">
            <EmptySpace
              title="You don't have any module yet."
              description="A cycle is a fixed time period where a team commits to a set number of issues from their backlog. Cycles are usually one, two, or four weeks long."
              Icon={RectangleGroupIcon}
            >
              <EmptySpaceItem
                title="Create a new module"
                description={
                  <span>
                    Use <pre className="inline rounded bg-gray-100 px-2 py-1">Ctrl/Command + M</pre>{" "}
                    shortcut to create a new cycle
                  </span>
                }
                Icon={PlusIcon}
                action={() => {
                  const e = new KeyboardEvent("keydown", {
                    ctrlKey: true,
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
          <Loader.Item height="100px"></Loader.Item>
          <Loader.Item height="100px"></Loader.Item>
          <Loader.Item height="100px"></Loader.Item>
          <Loader.Item height="100px"></Loader.Item>
          <Loader.Item height="100px"></Loader.Item>
          <Loader.Item height="100px"></Loader.Item>
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
