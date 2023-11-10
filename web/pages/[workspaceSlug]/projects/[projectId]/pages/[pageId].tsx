import React, { useEffect, useRef, useState, ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import { Controller, useForm } from "react-hook-form";
import { Popover, Transition } from "@headlessui/react";
import { TwitterPicker } from "react-color";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
// services
import { ProjectService, ProjectMemberService } from "services/project";
import { PageService } from "services/page.service";
import { IssueLabelService } from "services/issue";
// hooks
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import { CreateUpdateBlockInline, SinglePageBlock } from "components/pages";
import { CreateLabelModal } from "components/labels";
import { CreateBlock } from "components/pages/create-block";
import { PageDetailsHeader } from "components/headers/page-details";
// ui
import { DocumentEditorWithRef } from "@plane/document-editor"
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";

import { CustomSearchSelect, TextArea, Loader, ToggleSwitch, Tooltip } from "@plane/ui";
// images
import emptyPage from "public/empty-state/page.svg";

import { copyTextToClipboard, truncateText } from "helpers/string.helper";
import { orderArrayBy } from "helpers/array.helper";
import { EmptyState } from "components/common";
// types
import { NextPageWithLayout } from "types/app";
import { IIssueLabels, IPage, IPageBlock, IProjectMember } from "types";
// fetch-keys
import {
  PAGE_BLOCKS_LIST,
  PAGE_DETAILS,
  PROJECT_DETAILS,
  PROJECT_ISSUE_LABELS,
  USER_PROJECT_VIEW,
} from "constants/fetch-keys";
import { FileService } from "services/file.service";

// services
const projectService = new ProjectService();
const fileService = new FileService();
const projectMemberService = new ProjectMemberService();
const pageService = new PageService();
const issueLabelService = new IssueLabelService();

const PageDetailsPage: NextPageWithLayout = () => {

  const editorRef = useRef<any>(null);

  const [createBlockForm, setCreateBlockForm] = useState(false);
  const [labelModal, setLabelModal] = useState(false);
  const [showBlock, setShowBlock] = useState(false);

  const scrollToRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;

  const { setToastAlert } = useToast();

  const { user } = useUser();

  const { handleSubmit, reset, watch, setValue, formState: { isSubmitting }, control } = useForm<IPage>({
    defaultValues: { name: "" },
  });

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId ? () => projectService.getProject(workspaceSlug as string, projectId as string) : null
  );

  const { data: pageDetails, error } = useSWR(
    workspaceSlug && projectId && pageId ? PAGE_DETAILS(pageId as string) : null,
    workspaceSlug && projectId
      ? () => pageService.getPageDetails(workspaceSlug as string, projectId as string, pageId as string)
      : null
  );

  const { data: pageBlocks } = useSWR(
    workspaceSlug && projectId && pageId ? PAGE_BLOCKS_LIST(pageId as string) : null,
    workspaceSlug && projectId
      ? () => pageService.listPageBlocks(workspaceSlug as string, projectId as string, pageId as string)
      : null
  );

  const { data: labels } = useSWR<IIssueLabels[]>(
    workspaceSlug && projectId ? PROJECT_ISSUE_LABELS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => issueLabelService.getProjectIssueLabels(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: memberDetails } = useSWR(
    workspaceSlug && projectId ? USER_PROJECT_VIEW(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () => projectMemberService.projectMemberMe(workspaceSlug.toString(), projectId.toString())
      : null
  );

  const updatePage = async (formData: IPage) => {
    if (!workspaceSlug || !projectId || !pageId) return;

    if (!formData.name || formData.name.length === 0 || formData.name === "") return;

    await pageService
      .patchPage(workspaceSlug as string, projectId as string, pageId as string, formData, user)
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
      }),
      false
    );

    await pageService
      .patchPage(workspaceSlug as string, projectId as string, pageId as string, formData, user)
      .then(() => {
        mutate(PAGE_DETAILS(pageId as string));
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
    ).then(() => {
      setToastAlert({
        type: "success",
        title: "Success",
        message: "Added to favorites",
      });
    });

    pageService.addPageToFavorites(workspaceSlug as string, projectId as string, {
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
    ).then(() => {
      setToastAlert({
        type: "success",
        title: "Success",
        message: "Removed from favorites",
      });
    });

    pageService.removePageFromFavorites(workspaceSlug as string, projectId as string, pageId as string);
  };

  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination || !workspaceSlug || !projectId || !pageId || !pageBlocks) return;

    const { source, destination } = result;

    let newSortOrder = pageBlocks.find((p) => p.id === result.draggableId)?.sort_order ?? 65535;

    if (destination.index === 0) newSortOrder = pageBlocks[0].sort_order - 10000;
    else if (destination.index === pageBlocks.length - 1)
      newSortOrder = pageBlocks[pageBlocks.length - 1].sort_order + 10000;
    else {
      if (destination.index > source.index)
        newSortOrder = (pageBlocks[destination.index].sort_order + pageBlocks[destination.index + 1].sort_order) / 2;
      else if (destination.index < source.index)
        newSortOrder = (pageBlocks[destination.index - 1].sort_order + pageBlocks[destination.index].sort_order) / 2;
    }

    const newBlocksList = pageBlocks.map((p) => ({
      ...p,
      sort_order: p.id === result.draggableId ? newSortOrder : p.sort_order,
    }));
    mutate<IPageBlock[]>(
      PAGE_BLOCKS_LIST(pageId as string),
      orderArrayBy(newBlocksList, "sort_order", "ascending"),
      false
    );

    pageService.patchPageBlock(
      workspaceSlug as string,
      projectId as string,
      pageId as string,
      result.draggableId,
      {
        sort_order: newSortOrder,
      },
      user
    );
  };

  const handleCopyText = () => {
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/pages/${pageId}`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Page link copied to clipboard.",
      });
    });
  };

  const handleShowBlockToggle = async () => {
    if (!workspaceSlug || !projectId) return;

    const payload: Partial<IProjectMember> = {
      preferences: {
        pages: {
          block_display: !showBlock,
        },
      },
    };

    mutate<IProjectMember>(
      (workspaceSlug as string) && (projectId as string) ? USER_PROJECT_VIEW(projectId as string) : null,
      (prevData) => {
        if (!prevData) return prevData;

        return {
          ...prevData,
          ...payload,
        };
      },
      false
    );

    await projectService.setProjectView(workspaceSlug as string, projectId as string, payload).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Something went wrong. Please try again.",
      });
    });
  };

  const options = labels?.map((label) => ({
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
  }));

  useEffect(() => {
    if (!pageDetails) return;

    reset({
      ...pageDetails,
    });
  }, [reset, pageDetails]);

  useEffect(() => {
    if (!memberDetails) return;
    setShowBlock(memberDetails.preferences.pages.block_display);
  }, [memberDetails]);

  return (
    <>
      {error ? (
        <EmptyState
          image={emptyPage}
          title="Page does not exist"
          description="The page you are looking for does not exist or has been deleted."
          primaryButton={{
            text: "View other pages",
            onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/pages`),
          }}
        />
      ) : pageDetails ? (
        <div className="flex h-full flex-col justify-between p-5">
          <div className="h-full w-full">
            <Controller
              name="description_html"
              control={control}
              render={({ field: { value, onChange } }) =>
              (
              <DocumentEditorWithRef
                uploadFile={fileService.getUploadFileFunction(workspaceSlug as string)}
                deleteFile={fileService.deleteImage}
                ref={editorRef}
                debouncedUpdatesEnabled={false}
                value={
                  !value || value === "" || (typeof value === "object" && Object.keys(value).length === 0)
                    ? watch("description_html")
                    : value
                }
                customClassName="tracking-tight self-center w-full max-w-full px-0"
                onChange={(description_json: Object, description_html: string) => {
                  onChange(description_html);
                }}
              />)
              }
            />
          </div>
        </div>
      ) : (
        <Loader className="p-8">
          <Loader.Item height="200px" />
        </Loader>
      )}
    </>
  );
};

PageDetailsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<PageDetailsHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default PageDetailsPage;
