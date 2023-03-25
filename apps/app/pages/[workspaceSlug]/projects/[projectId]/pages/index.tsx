import { useState } from "react";

import { useRouter } from "next/router";
import type { GetServerSidePropsContext, NextPage } from "next";
import dynamic from "next/dynamic";

import useSWR from "swr";

// lib
import { requiredAuth } from "lib/auth";

// headless ui
import { Tab } from "@headlessui/react";
// services
import projectService from "services/project.service";
import pagesService from "services/pages.service";
// icons
import { PlusIcon } from "components/icons";
// layouts
import AppLayout from "layouts/app-layout";
// components
import { RecentPagesList, CreateUpdatePageModal } from "components/pages";
// ui
import { HeaderButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { ListBulletIcon, RectangleGroupIcon, Squares2X2Icon } from "@heroicons/react/20/solid";
// types
import { TPageViewProps } from "types";
// fetch-keys
import { PROJECT_DETAILS, RECENT_PAGES_LIST } from "constants/fetch-keys";

const AllPagesList = dynamic(() => import("components/pages").then((a) => a.AllPagesList), {
  ssr: false,
});

const FavoritePagesList = dynamic(
  () => import("components/pages").then((a) => a.FavoritePagesList),
  {
    ssr: false,
  }
);

const MyPagesList = dynamic(() => import("components/pages").then((a) => a.MyPagesList), {
  ssr: false,
});

const OtherPagesList = dynamic(() => import("components/pages").then((a) => a.OtherPagesList), {
  ssr: false,
});

const ProjectPages: NextPage = () => {
  const [createUpdatePageModal, setCreateUpdatePageModal] = useState(false);

  const [viewType, setViewType] = useState<TPageViewProps>("list");

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: activeProject } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: recentPages } = useSWR(
    workspaceSlug && projectId ? RECENT_PAGES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => pagesService.getRecentPages(workspaceSlug as string, projectId as string)
      : null
  );

  return (
    <>
      <CreateUpdatePageModal
        isOpen={createUpdatePageModal}
        handleClose={() => setCreateUpdatePageModal(false)}
      />
      <AppLayout
        meta={{
          title: "Plane - Pages",
        }}
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
            <BreadcrumbItem title={`${activeProject?.name ?? "Project"} Pages`} />
          </Breadcrumbs>
        }
        right={
          <HeaderButton
            Icon={PlusIcon}
            label="Create Page"
            onClick={() => setCreateUpdatePageModal(true)}
          />
        }
      >
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-4 pt-3 pb-4 shadow-sm ">
            <label htmlFor="name" className="sr-only">
              Title
            </label>
            <input
              type="text"
              name="name"
              id="name"
              className="block w-full border-0 pt-2.5 text-lg font-medium placeholder-gray-500 outline-none focus:ring-0"
              placeholder="Title"
            />
            <label htmlFor="description" className="sr-only">
              Description
            </label>
            <textarea
              rows={2}
              name="description"
              id="description"
              className="block w-full resize-none border-0 pb-8 placeholder-gray-500 outline-none focus:ring-0 sm:text-sm"
              placeholder="Write something..."
              defaultValue={""}
            />
          </div>

          {/* <div className="space-y-2 pb-8">
          <h3 className="text-3xl font-semibold text-black">Pages</h3>
          <p className="text-sm text-gray-500">
            Note down all the important and minor details in the way you want to.
          </p>
        </div> */}
          <div>
            <Tab.Group>
              <Tab.List as="div" className="flex items-center justify-between">
                <div className="flex gap-4">
                  {["Recent", "All", "Favorites", "Created by me", "Created by others"].map(
                    (tab, index) => (
                      <Tab
                        key={index}
                        className={({ selected }) =>
                          `rounded-full border px-5 py-1.5 text-sm outline-none ${
                            selected
                              ? "border-theme bg-theme text-white"
                              : "border-gray-300 bg-white hover:bg-hover-gray"
                          }`
                        }
                      >
                        {tab}
                      </Tab>
                    )
                  )}
                </div>
                <div className="flex items-center gap-x-1">
                  <button
                    type="button"
                    className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200 ${
                      viewType === "list" ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setViewType("list")}
                  >
                    <ListBulletIcon className="h-4 w-4" />
                  </button>
                  {/* <button
                    type="button"
                    className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200 ${
                      viewType === "detailed" ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setViewType("detailed")}
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button> */}
                  <button
                    type="button"
                    className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200 ${
                      viewType === "masonry" ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setViewType("masonry")}
                  >
                    <RectangleGroupIcon className="h-4 w-4" />
                  </button>
                </div>
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel>
                  <RecentPagesList pages={recentPages} viewType={viewType} />
                </Tab.Panel>
                <Tab.Panel>
                  <AllPagesList viewType={viewType} />
                </Tab.Panel>
                <Tab.Panel>
                  <FavoritePagesList viewType={viewType} />
                </Tab.Panel>
                <Tab.Panel>
                  <MyPagesList viewType={viewType} />
                </Tab.Panel>
                <Tab.Panel>
                  <OtherPagesList viewType={viewType} />
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>
      </AppLayout>
    </>
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

export default ProjectPages;
