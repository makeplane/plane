import React, { useEffect } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// lib
import { requiredAuth } from "lib/auth";
// services
import projectService from "services/project.service";
import pagesService from "services/pages.service";
// hooks
import useToast from "hooks/use-toast";
// layouts
import AppLayout from "layouts/app-layout";
// components
import { SinglePageBlock } from "components/pages";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
import { Loader, PrimaryButton, TextArea } from "components/ui";
// icons
import { ArrowLeftIcon, PlusIcon, ShareIcon, StarIcon } from "@heroicons/react/24/outline";
// helpers
import { renderShortTime } from "helpers/date-time.helper";
import { copyTextToClipboard } from "helpers/string.helper";
// types
import type { NextPage, GetServerSidePropsContext } from "next";
import { IPage, IPageBlock } from "types";
// fetch-keys
import { PAGE_BLOCKS_LIST, PAGE_DETAILS, PROJECT_DETAILS } from "constants/fetch-keys";

const SinglePage: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;

  const { setToastAlert } = useToast();

  const { handleSubmit, reset, watch, setValue } = useForm<IPage>({ defaultValues: { name: "" } });

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

  const createPageBlock = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;

    await pagesService
      .createPageBlock(workspaceSlug as string, projectId as string, pageId as string, {
        name: "New block",
        description_html: "<p>New block description...</p>",
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
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {renderShortTime(pageDetails.created_at)}
              </span>
              <PrimaryButton className="flex items-center gap-2" onClick={handleCopyText}>
                <ShareIcon className="h-4 w-4" />
                Share
              </PrimaryButton>
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
                      <SinglePageBlock key={block.id} block={block} />
                    ))}
                  </div>
                  <div className="-mr-3 flex justify-end">
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

  return {
    props: {
      user,
    },
  };
};

export default SinglePage;
