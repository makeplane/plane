import React, { useEffect } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// react-color
import { TwitterPicker } from "react-color";
// lib
import { requiredAdmin, requiredAuth } from "lib/auth";
// services
import projectService from "services/project.service";
import pagesService from "services/pages.service";
import issuesService from "services/issues.service";
// hooks
import useToast from "hooks/use-toast";
// layouts
import AppLayout from "layouts/app-layout";
// components
import { SinglePageBlock } from "components/pages";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
import { CustomSearchSelect, Loader, PrimaryButton, TextArea } from "components/ui";
// icons
import { ArrowLeftIcon, PlusIcon, ShareIcon, StarIcon } from "@heroicons/react/24/outline";
import { ColorPalletteIcon } from "components/icons";
// helpers
import { renderShortTime } from "helpers/date-time.helper";
import { copyTextToClipboard } from "helpers/string.helper";
// types
import type { NextPage, GetServerSidePropsContext } from "next";
import { IIssueLabels, IPage, IPageBlock, UserAuth } from "types";
// fetch-keys
import {
  PAGE_BLOCKS_LIST,
  PAGE_DETAILS,
  PROJECT_DETAILS,
  PROJECT_ISSUE_LABELS,
} from "constants/fetch-keys";

const SinglePage: NextPage<UserAuth> = (props) => {
  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;

  const { setToastAlert } = useToast();

  const { handleSubmit, reset, watch, setValue, control } = useForm<IPage>({
    defaultValues: { name: "" },
  });

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: pageDetails } = useSWR(
    workspaceSlug && projectId && pageId ? PAGE_DETAILS(pageId as string) : null,
    workspaceSlug && projectId
      ? () =>
          pagesService.getPageDetails(
            workspaceSlug as string,
            projectId as string,
            pageId as string
          )
      : null
  );

  const { data: pageBlocks } = useSWR(
    workspaceSlug && projectId && pageId ? PAGE_BLOCKS_LIST(pageId as string) : null,
    workspaceSlug && projectId
      ? () =>
          pagesService.listPageBlocks(
            workspaceSlug as string,
            projectId as string,
            pageId as string
          )
      : null
  );

  const { data: labels } = useSWR<IIssueLabels[]>(
    workspaceSlug && projectId ? PROJECT_ISSUE_LABELS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssueLabels(workspaceSlug as string, projectId as string)
      : null
  );

  const updatePage = async (formData: IPage) => {
    if (!workspaceSlug || !projectId || !pageId) return;

    if (!formData.name || formData.name.length === 0 || formData.name === "") return;

    await pagesService
      .patchPage(workspaceSlug as string, projectId as string, pageId as string, formData)
      .then(() => {
        mutate<IPage>(
          PAGE_DETAILS(pageId as string),
          (prevData) => ({
            ...prevData,
            ...formData,
          }),
          false
        );
      });
  };

  const partialUpdatePage = async (formData: Partial<IPage>) => {
    if (!workspaceSlug || !projectId || !pageId) return;

    mutate<IPage>(
      PAGE_DETAILS(pageId as string),
      (prevData) => ({
        ...(prevData as IPage),
        ...formData,
        labels: formData.labels_list ? formData.labels_list : (prevData as IPage).labels,
      }),
      false
    );

    await pagesService
      .patchPage(workspaceSlug as string, projectId as string, pageId as string, formData)
      .then(() => {
        mutate(PAGE_DETAILS(pageId as string));
      });
  };

  const createPageBlock = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;

    await pagesService
      .createPageBlock(workspaceSlug as string, projectId as string, pageId as string, {
        name: "New block",
      })
      .then((res) => {
        mutate<IPageBlock[]>(
          PAGE_BLOCKS_LIST(pageId as string),
          (prevData) => [...(prevData as IPageBlock[]), res],
          false
        );
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Page could not be created. Please try again.",
        });
      });
  };

  const handleAddToFavorites = () => {
    if (!workspaceSlug || !projectId || !pageId) return;

    mutate<IPage>(
      PAGE_DETAILS(pageId as string),
      (prevData) => ({
        ...(prevData as IPage),
        is_favorite: true,
      }),
      false
    );

    pagesService.addPageToFavorites(workspaceSlug as string, projectId as string, {
      page: pageId as string,
    });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !projectId || !pageId) return;

    mutate<IPage>(
      PAGE_DETAILS(pageId as string),
      (prevData) => ({
        ...(prevData as IPage),
        is_favorite: false,
      }),
      false
    );

    pagesService.removePageFromFavorites(
      workspaceSlug as string,
      projectId as string,
      pageId as string
    );
  };

  const handleCopyText = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/pages/${pageId}`).then(
      () => {
        setToastAlert({
          type: "success",
          title: "Link Copied!",
          message: "Page link copied to clipboard.",
        });
      }
    );
  };

  const options =
    labels?.map((label) => ({
      value: label.id,
      query: label.name,
      content: (
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{
              backgroundColor: label.color && label.color !== "" ? label.color : "#000000",
            }}
          />
          {label.name}
        </div>
      ),
    })) ?? [];

  useEffect(() => {
    if (!pageDetails) return;

    reset({
      ...pageDetails,
    });
  }, [reset, pageDetails]);

  return (
    <AppLayout
      meta={{
        title: "Plane - Pages",
      }}
      memberType={props}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`${projectDetails?.name ?? "Project"} Pages`} />
        </Breadcrumbs>
      }
    >
      {pageDetails ? (
        <div className="h-full w-full space-y-4 rounded-md border bg-white p-4">
          <div className="flex items-center justify-between gap-2 px-3">
            <button
              type="button"
              className="flex items-center gap-2 text-sm text-gray-500"
              onClick={() => router.back()}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>
            <div className="flex flex-wrap gap-1">
              {pageDetails.labels.length > 0 ? (
                <>
                  {pageDetails.labels.map((labelId) => {
                    const label = labels?.find((label) => label.id === labelId);

                    if (!label) return;

                    return (
                      <div
                        key={label.id}
                        className="group flex items-center gap-1 rounded-2xl border px-2 py-0.5 text-xs"
                        style={{
                          backgroundColor: `${
                            label?.color && label.color !== "" ? label.color : "#000000"
                          }20`,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              label?.color && label.color !== "" ? label.color : "#000000",
                          }}
                        />
                        {label.name}
                      </div>
                    );
                  })}
                  <CustomSearchSelect
                    customButton={
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded-md bg-gray-100 p-1.5 text-xs hover:bg-gray-200"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    }
                    value={pageDetails.labels}
                    onChange={(val: string[]) => partialUpdatePage({ labels_list: val })}
                    options={options}
                    multiple
                    noChevron
                  />
                </>
              ) : (
                <CustomSearchSelect
                  customButton={
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-xs hover:bg-gray-200"
                    >
                      <PlusIcon className="h-3 w-3" />
                      Add new label
                    </button>
                  }
                  value={pageDetails.labels}
                  onChange={(val: string[]) => partialUpdatePage({ labels_list: val })}
                  options={options}
                  multiple
                  noChevron
                />
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {renderShortTime(pageDetails.created_at)}
              </span>
              <PrimaryButton className="flex items-center gap-2" onClick={handleCopyText}>
                <ShareIcon className="h-4 w-4" />
                Share
              </PrimaryButton>
              <div className="flex-shrink-0">
                <Popover className="relative grid place-items-center">
                  {({ open }) => (
                    <>
                      <Popover.Button
                        type="button"
                        className={`group inline-flex items-center outline-none ${
                          open ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {watch("color") && watch("color") !== "" ? (
                          <span
                            className="h-4 w-4 rounded"
                            style={{
                              backgroundColor: watch("color") ?? "black",
                            }}
                          />
                        ) : (
                          <ColorPalletteIcon height={16} width={16} />
                        )}
                      </Popover.Button>

                      <Transition
                        as={React.Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                      >
                        <Popover.Panel className="absolute top-full right-0 z-20 mt-1 max-w-xs px-2 sm:px-0">
                          <TwitterPicker
                            color={pageDetails.color}
                            onChange={(val) => partialUpdatePage({ color: val.hex })}
                          />
                        </Popover.Panel>
                      </Transition>
                    </>
                  )}
                </Popover>
              </div>
              {pageDetails.is_favorite ? (
                <button onClick={handleRemoveFromFavorites} className="z-10">
                  <StarIcon className="h-4 w-4 text-orange-400" fill="#f6ad55" />
                </button>
              ) : (
                <button onClick={handleAddToFavorites} type="button" className="z-10">
                  <StarIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div>
            <TextArea
              id="name"
              name="name"
              placeholder="Enter issue name"
              value={watch("name")}
              onBlur={handleSubmit(updatePage)}
              onChange={(e) => setValue("name", e.target.value)}
              required={true}
              className="min-h-10 block w-full resize-none overflow-hidden rounded border-none bg-transparent px-3 py-2 text-2xl font-semibold outline-none ring-0 focus:ring-1 focus:ring-theme"
              role="textbox"
            />
          </div>
          <div className="px-3">
            {pageBlocks ? (
              pageBlocks.length === 0 ? (
                <button
                  type="button"
                  className="flex items-center gap-1 rounded px-2.5 py-1 text-xs hover:bg-gray-100"
                  onClick={createPageBlock}
                >
                  <PlusIcon className="h-3 w-3" />
                  Add new block
                </button>
              ) : (
                <>
                  <div className="space-y-4">
                    {pageBlocks.map((block) => (
                      <SinglePageBlock
                        key={block.id}
                        block={block}
                        projectDetails={projectDetails}
                      />
                    ))}
                  </div>
                  <div className="">
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded px-2.5 py-1 text-xs hover:bg-gray-100"
                      onClick={createPageBlock}
                    >
                      <PlusIcon className="h-3 w-3" />
                      Add new block
                    </button>
                  </div>
                </>
              )
            ) : (
              <Loader>
                <Loader.Item height="150px" />
                <Loader.Item height="150px" />
              </Loader>
            )}
          </div>
        </div>
      ) : (
        <Loader>
          <Loader.Item height="200px" />
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

export default SinglePage;
