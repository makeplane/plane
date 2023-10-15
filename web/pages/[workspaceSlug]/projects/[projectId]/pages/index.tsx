import { useState, Fragment } from "react";

import { useRouter } from "next/router";
import dynamic from "next/dynamic";

import useSWR from "swr";

// headless ui
import { Tab } from "@headlessui/react";
// services
import { ProjectService } from "services/project";
// hooks
import useLocalStorage from "hooks/use-local-storage";
import useUserAuth from "hooks/use-user-auth";
// icons
import { PlusIcon } from "components/icons";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// components
import { RecentPagesList, CreateUpdatePageModal, TPagesListProps } from "components/pages";
// ui
import { Button } from "@plane/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { ListBulletIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
// types
import { TPageViewProps } from "types";
import type { NextPage } from "next";
// fetch-keys
import { PROJECT_DETAILS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";

const AllPagesList = dynamic<TPagesListProps>(() => import("components/pages").then((a) => a.AllPagesList), {
  ssr: false,
});

const FavoritePagesList = dynamic<TPagesListProps>(() => import("components/pages").then((a) => a.FavoritePagesList), {
  ssr: false,
});

const MyPagesList = dynamic<TPagesListProps>(() => import("components/pages").then((a) => a.MyPagesList), {
  ssr: false,
});

const OtherPagesList = dynamic<TPagesListProps>(() => import("components/pages").then((a) => a.OtherPagesList), {
  ssr: false,
});

const tabsList = ["Recent", "All", "Favorites", "Created by me", "Created by others"];

// services
const projectService = new ProjectService();

const ProjectPages: NextPage = () => {
  const [createUpdatePageModal, setCreateUpdatePageModal] = useState(false);

  const [viewType, setViewType] = useState<TPageViewProps>("list");

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUserAuth();

  const { storedValue: pageTab, setValue: setPageTab } = useLocalStorage("pageTab", "Recent");

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId ? () => projectService.getProject(workspaceSlug as string, projectId as string) : null
  );

  const currentTabValue = (tab: string | null) => {
    switch (tab) {
      case "Recent":
        return 0;
      case "All":
        return 1;
      case "Favorites":
        return 2;
      case "Created by me":
        return 3;
      case "Created by others":
        return 4;

      default:
        return 0;
    }
  };

  return (
    <>
      <CreateUpdatePageModal
        isOpen={createUpdatePageModal}
        handleClose={() => setCreateUpdatePageModal(false)}
        user={user}
      />
      <ProjectAuthorizationWrapper
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
            <BreadcrumbItem title={`${truncateText(projectDetails?.name ?? "Project", 32)} Pages`} />
          </Breadcrumbs>
        }
        right={
          <Button
            variant="primary"
            prependIcon={<PlusIcon />}
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "d" });
              document.dispatchEvent(e);
            }}
          >
            Create Page
          </Button>
        }
      >
        <div className="space-y-5 p-8 h-full overflow-hidden flex flex-col">
          <div className="flex gap-4 justify-between">
            <h3 className="text-2xl font-semibold text-custom-text-100">Pages</h3>
            <div className="flex gap-x-1">
              <button
                type="button"
                className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-custom-background-80 ${
                  viewType === "list" ? "bg-custom-background-80" : ""
                }`}
                onClick={() => setViewType("list")}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-custom-background-80 ${
                  viewType === "detailed" ? "bg-custom-background-80" : ""
                }`}
                onClick={() => setViewType("detailed")}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <Tab.Group
            as={Fragment}
            defaultIndex={currentTabValue(pageTab)}
            onChange={(i) => {
              switch (i) {
                case 0:
                  return setPageTab("Recent");
                case 1:
                  return setPageTab("All");
                case 2:
                  return setPageTab("Favorites");
                case 3:
                  return setPageTab("Created by me");
                case 4:
                  return setPageTab("Created by others");

                default:
                  return setPageTab("Recent");
              }
            }}
          >
            <Tab.List as="div" className="mb-6 flex items-center justify-between">
              <div className="flex gap-4 items-center flex-wrap">
                {tabsList.map((tab, index) => (
                  <Tab
                    key={`${tab}-${index}`}
                    className={({ selected }) =>
                      `rounded-full border px-5 py-1.5 text-sm outline-none ${
                        selected
                          ? "border-custom-primary bg-custom-primary text-white"
                          : "border-custom-border-200 bg-custom-background-100 hover:bg-custom-background-90"
                      }`
                    }
                  >
                    {tab}
                  </Tab>
                ))}
              </div>
            </Tab.List>
            <Tab.Panels as={Fragment}>
              <Tab.Panel as="div" className="h-full overflow-y-auto space-y-5">
                <RecentPagesList viewType={viewType} />
              </Tab.Panel>
              <Tab.Panel as="div" className="h-full overflow-hidden">
                <AllPagesList viewType={viewType} />
              </Tab.Panel>
              <Tab.Panel as="div" className="h-full overflow-hidden">
                <FavoritePagesList viewType={viewType} />
              </Tab.Panel>
              <Tab.Panel as="div" className="h-full overflow-hidden">
                <MyPagesList viewType={viewType} />
              </Tab.Panel>
              <Tab.Panel as="div" className="h-full overflow-hidden">
                <OtherPagesList viewType={viewType} />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </ProjectAuthorizationWrapper>
    </>
  );
};

export default ProjectPages;
