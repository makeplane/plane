import { useState } from "react";

import { useRouter } from "next/router";
import dynamic from "next/dynamic";

import useSWR, { mutate } from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// headless ui
import { Tab } from "@headlessui/react";
// services
import projectService from "services/project.service";
import pagesService from "services/pages.service";
// hooks
import useToast from "hooks/use-toast";
import useLocalStorage from "hooks/use-local-storage";
// icons
import { PlusIcon } from "components/icons";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// components
import { RecentPagesList, CreateUpdatePageModal, TPagesListProps } from "components/pages";
// ui
import { Input, PrimaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { ListBulletIcon, Squares2X2Icon } from "@heroicons/react/20/solid";
// types
import { IPage, TPageViewProps } from "types";
import type { NextPage } from "next";
// fetch-keys
import {
  ALL_PAGES_LIST,
  MY_PAGES_LIST,
  PROJECT_DETAILS,
  RECENT_PAGES_LIST,
} from "constants/fetch-keys";

const AllPagesList = dynamic<TPagesListProps>(
  () => import("components/pages").then((a) => a.AllPagesList),
  {
    ssr: false,
  }
);

const FavoritePagesList = dynamic<TPagesListProps>(
  () => import("components/pages").then((a) => a.FavoritePagesList),
  {
    ssr: false,
  }
);

const MyPagesList = dynamic<TPagesListProps>(
  () => import("components/pages").then((a) => a.MyPagesList),
  {
    ssr: false,
  }
);

const OtherPagesList = dynamic<TPagesListProps>(
  () => import("components/pages").then((a) => a.OtherPagesList),
  {
    ssr: false,
  }
);

const ProjectPages: NextPage = () => {
  const [createUpdatePageModal, setCreateUpdatePageModal] = useState(false);

  const [viewType, setViewType] = useState<TPageViewProps>("list");

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const { storedValue: pageTab, setValue: setPageTab } = useLocalStorage("pageTab", "Recent");

  const {
    handleSubmit,
    register,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<Partial<IPage>>({
    defaultValues: {
      name: "",
    },
  });

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const createPage = async (formData: Partial<IPage>) => {
    if (!workspaceSlug || !projectId) return;

    if (formData.name === "") {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Page name is required",
      });
      return;
    }

    await pagesService
      .createPage(workspaceSlug as string, projectId as string, formData)
      .then((res) => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Page created successfully.",
        });
        router.push(`/${workspaceSlug}/projects/${projectId}/pages/${res.id}`);
        reset();

        mutate(RECENT_PAGES_LIST(projectId as string));
        mutate<IPage[]>(
          MY_PAGES_LIST(projectId as string),
          (prevData) => {
            if (!prevData) return undefined;

            return [res, ...(prevData as IPage[])];
          },
          false
        );
        mutate<IPage[]>(
          ALL_PAGES_LIST(projectId as string),
          (prevData) => {
            if (!prevData) return undefined;

            return [res, ...(prevData as IPage[])];
          },
          false
        );
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Page could not be created. Please try again",
        });
      });
  };


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
      />
      <ProjectAuthorizationWrapper
        meta={{
          title: "Plane - Pages",
        }}
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
            <BreadcrumbItem title={`${projectDetails?.name ?? "Project"} Pages`} />
          </Breadcrumbs>
        }
        right={
          <PrimaryButton
            className="flex items-center gap-2"
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "d" });
              document.dispatchEvent(e);
            }}
          >
            <PlusIcon className="w-4 h-4" />
            Create Page
          </PrimaryButton>
        }
      >
        <div className="space-y-4">
          <form
            onSubmit={handleSubmit(createPage)}
            className="flex items-center relative justify-between gap-2 mb-12 rounded-[6px] border border-gray-200 bg-white p-2 shadow"
          >
            <Input
              type="text"
              name="name"
              register={register}
              className="border-none font-medium flex break-all text-xl outline-none focus:ring-0"
              placeholder="Title"
            />
            {watch("name") !== "" && (
              <PrimaryButton type="submit" loading={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create"}
              </PrimaryButton>
            )}
          </form>
          <div>
            <Tab.Group
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
              <Tab.List as="div" className="flex items-center justify-between mb-6">
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
                <div className="flex gap-x-1">
                  <button
                    type="button"
                    className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200 ${
                      viewType === "list" ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setViewType("list")}
                  >
                    <ListBulletIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200 ${
                      viewType === "detailed" ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setViewType("detailed")}
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  {/* <button
                    type="button"
                    className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200 ${
                      viewType === "masonry" ? "bg-gray-200" : ""
                    }`}
                    onClick={() => setViewType("masonry")}
                  >
                    <RectangleGroupIcon className="h-4 w-4" />
                  </button> */}
                </div>
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel>
                  <RecentPagesList viewType={viewType} />
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
      </ProjectAuthorizationWrapper>
    </>
  );
};

export default ProjectPages;
