import React, { useEffect, useRef, useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// react-color
import { TwitterPicker } from "react-color";
// react-beautiful-dnd
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
// services
import { ProjectService } from "services/project";
import { PageService } from "services/page.service";
import { IssueLabelService } from "services/issue";
// hooks
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// components
import { CreateUpdateBlockInline, SinglePageBlock } from "components/pages";
import { CreateLabelModal } from "components/labels";
import { CreateBlock } from "components/pages/create-block";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
import { CustomSearchSelect } from "components/ui";
import { EmptyState } from "components/common";
import { TextArea, Loader, ToggleSwitch, Tooltip } from "@plane/ui";
// images
import emptyPage from "public/empty-state/page.svg";
// icons
import {
  ArrowLeftIcon,
  LockClosedIcon,
  LockOpenIcon,
  PlusIcon,
  StarIcon,
  LinkIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { ColorPalletteIcon } from "components/icons";
// helpers
import { render24HourFormatTime, renderShortDate } from "helpers/date-time.helper";
import { copyTextToClipboard, truncateText } from "helpers/string.helper";
import { orderArrayBy } from "helpers/array.helper";
// types
import type { NextPage } from "next";
import { IIssueLabels, IPage, IPageBlock, IProjectMember } from "types";
// fetch-keys
import {
  PAGE_BLOCKS_LIST,
  PAGE_DETAILS,
  PROJECT_DETAILS,
  PROJECT_ISSUE_LABELS,
  USER_PROJECT_VIEW,
} from "constants/fetch-keys";

// services
const projectService = new ProjectService();
const pageService = new PageService();
const issueLabelService = new IssueLabelService();

const SinglePage: NextPage = () => {
  const [createBlockForm, setCreateBlockForm] = useState(false);
  const [labelModal, setLabelModal] = useState(false);
  const [showBlock, setShowBlock] = useState(false);

  const scrollToRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;

  const { setToastAlert } = useToast();

  const { user } = useUser();

  const { handleSubmit, reset, watch, setValue, control } = useForm<IPage>({
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
      ? () => projectService.projectMemberMe(workspaceSlug.toString(), projectId.toString())
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
        labels: formData.labels_list ? formData.labels_list : (prevData as IPage).labels,
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
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`${truncateText(projectDetails?.name ?? "Project", 32)} Pages`} />
        </Breadcrumbs>
      }
    >
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
        <div className="flex h-full flex-col justify-between space-y-4 overflow-hidden p-4">
          <div className="h-full w-full overflow-y-auto">
            <div className="flex items-start justify-between gap-2">
              <div className="flex w-full flex-col gap-2">
                <div className="flex w-full items-center gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-custom-text-200"
                    onClick={() => router.back()}
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                  </button>

                  <Controller
                    name="name"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <TextArea
                        id="name"
                        name="name"
                        value={watch("name")}
                        placeholder="Page Title"
                        onBlur={handleSubmit(updatePage)}
                        onChange={(e) => setValue("name", e.target.value)}
                        required={true}
                        className="min-h-10 block w-full resize-none overflow-hidden rounded border-none bg-transparent !px-3 !py-2 text-xl font-semibold outline-none ring-0"
                        role="textbox"
                      />
                    )}
                  />
                </div>

                <div className="flex w-full flex-wrap gap-1">
                  {pageDetails.labels.length > 0 && (
                    <>
                      {pageDetails.labels.map((labelId) => {
                        const label = labels?.find((label) => label.id === labelId);

                        if (!label) return;

                        return (
                          <div
                            key={label.id}
                            className="group flex cursor-pointer items-center gap-1 rounded-2xl border border-custom-border-200 px-2 py-0.5 text-xs hover:border-red-500 hover:bg-red-50"
                            onClick={() => {
                              const updatedLabels = pageDetails.labels.filter((l) => l !== labelId);
                              partialUpdatePage({ labels_list: updatedLabels });
                            }}
                            style={{
                              backgroundColor: `${label?.color && label.color !== "" ? label.color : "#000000"}20`,
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                              style={{
                                backgroundColor: label?.color && label.color !== "" ? label.color : "#000000",
                              }}
                            />
                            {label.name}
                            <XMarkIcon className="h-2.5 w-2.5 group-hover:text-red-500" />
                          </div>
                        );
                      })}
                    </>
                  )}
                  <CustomSearchSelect
                    customButton={
                      <div className="flex items-center gap-1 rounded-sm bg-custom-background-80 p-1.5 text-xs">
                        <PlusIcon className="h-3.5 w-3.5" />
                        {pageDetails.labels.length <= 0 && <span>Add Label</span>}
                      </div>
                    }
                    value={pageDetails.labels}
                    footerOption={
                      <button
                        type="button"
                        className="flex w-full select-none items-center rounded py-2 px-1 hover:bg-custom-background-80"
                        onClick={() => {
                          setLabelModal(true);
                        }}
                      >
                        <span className="flex items-center justify-start gap-1 text-custom-text-200">
                          <PlusIcon className="h-4 w-4" aria-hidden="true" />
                          <span>Create New Label</span>
                        </span>
                      </button>
                    }
                    onChange={(val: string[]) => partialUpdatePage({ labels_list: val })}
                    options={options}
                    multiple
                    noChevron
                  />
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex items-center gap-6 text-custom-text-200">
                  <Tooltip
                    tooltipContent={`Last updated at ${render24HourFormatTime(
                      pageDetails.updated_at
                    )} on ${renderShortDate(pageDetails.updated_at)}`}
                  >
                    <p className="text-sm">{render24HourFormatTime(pageDetails.updated_at)}</p>
                  </Tooltip>
                  <Popover className="relative">
                    {({ open }) => (
                      <>
                        <Popover.Button
                          className={`group flex items-center gap-2 rounded-md border border-custom-sidebar-border-200 bg-transparent px-2 py-1 text-xs hover:bg-custom-sidebar-background-90 hover:text-custom-sidebar-text-100 focus:outline-none duration-300 ${
                            open
                              ? "bg-custom-sidebar-background-90 text-custom-sidebar-text-100"
                              : "text-custom-sidebar-text-200"
                          }`}
                        >
                          Display
                          <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
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
                          <Popover.Panel className="absolute right-0 z-30 mt-1 w-screen max-w-xs transform rounded-lg border border-custom-border-200 bg-custom-background-90 p-3 shadow-lg">
                            <div className="relative divide-y-2 divide-custom-border-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-custom-text-200">Show full block content</span>
                                <ToggleSwitch
                                  value={showBlock}
                                  onChange={(value) => {
                                    setShowBlock(value);
                                    handleShowBlockToggle();
                                  }}
                                />
                              </div>
                            </div>
                          </Popover.Panel>
                        </Transition>
                      </>
                    )}
                  </Popover>
                  <button className="flex items-center gap-2" onClick={handleCopyText}>
                    <LinkIcon className="h-4 w-4" />
                  </button>
                  <div className="flex-shrink-0">
                    <Popover className="relative grid place-items-center">
                      {({ open }) => (
                        <>
                          <Popover.Button
                            type="button"
                            className={`group inline-flex items-center outline-none ${
                              open ? "text-custom-text-100" : "text-custom-text-200"
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
                                styles={{
                                  default: {
                                    card: {
                                      backgroundColor: `rgba(var(--color-background-80))`,
                                    },
                                    triangle: {
                                      position: "absolute",
                                      borderColor:
                                        "transparent transparent rgba(var(--color-background-80)) transparent",
                                    },
                                    input: {
                                      border: "none",
                                      height: "1.85rem",
                                      fontSize: "0.875rem",
                                      paddingLeft: "0.25rem",
                                      color: `rgba(var(--color-text-200))`,
                                      boxShadow: "none",
                                      backgroundColor: `rgba(var(--color-background-90))`,
                                      borderLeft: `1px solid rgba(var(--color-background-80))`,
                                    },
                                    hash: {
                                      color: `rgba(var(--color-text-200))`,
                                      boxShadow: "none",
                                      backgroundColor: `rgba(var(--color-background-90))`,
                                    },
                                  },
                                }}
                                onChange={(val) => partialUpdatePage({ color: val.hex })}
                              />
                            </Popover.Panel>
                          </Transition>
                        </>
                      )}
                    </Popover>
                  </div>
                  {pageDetails.created_by === user?.id && (
                    <Tooltip
                      tooltipContent={`${
                        pageDetails.access
                          ? "This page is only visible to you."
                          : "This page can be viewed by anyone in the project."
                      }`}
                    >
                      {pageDetails.access ? (
                        <button onClick={() => partialUpdatePage({ access: 0 })} className="z-10">
                          <LockClosedIcon className="h-4 w-4" />
                        </button>
                      ) : (
                        <button onClick={() => partialUpdatePage({ access: 1 })} type="button" className="z-10">
                          <LockOpenIcon className="h-4 w-4" />
                        </button>
                      )}
                    </Tooltip>
                  )}
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
            </div>

            <div className="mt-5 h-full w-full">
              {pageBlocks ? (
                <>
                  <DragDropContext onDragEnd={handleOnDragEnd}>
                    {pageBlocks.length !== 0 && (
                      <StrictModeDroppable droppableId="blocks-list">
                        {(provided) => (
                          <div
                            className="flex w-full flex-col gap-2"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            <>
                              {pageBlocks.map((block, index) => (
                                <SinglePageBlock
                                  key={block.id}
                                  block={block}
                                  projectDetails={projectDetails}
                                  showBlockDetails={showBlock}
                                  index={index}
                                  user={user}
                                />
                              ))}
                              {provided.placeholder}
                            </>
                          </div>
                        )}
                      </StrictModeDroppable>
                    )}
                  </DragDropContext>
                  {createBlockForm && (
                    <div className="mt-4" ref={scrollToRef}>
                      <CreateUpdateBlockInline handleClose={() => setCreateBlockForm(false)} focus="name" user={user} />
                    </div>
                  )}
                  {labelModal && typeof projectId === "string" && (
                    <CreateLabelModal
                      isOpen={labelModal}
                      handleClose={() => setLabelModal(false)}
                      projectId={projectId}
                      user={user}
                      onSuccess={(response) => {
                        partialUpdatePage({
                          labels_list: [...(pageDetails.labels ?? []), response.id],
                        });
                      }}
                    />
                  )}
                </>
              ) : (
                <Loader>
                  <Loader.Item height="150px" />
                  <Loader.Item height="150px" />
                </Loader>
              )}
            </div>
          </div>
          <div>
            <CreateBlock user={user} />
          </div>
        </div>
      ) : (
        <Loader className="p-8">
          <Loader.Item height="200px" />
        </Loader>
      )}
    </ProjectAuthorizationWrapper>
  );
};

export default SinglePage;
