import { useEffect, useState } from "react";

import { useRouter } from "next/router";
import Link from "next/link";
import dynamic from "next/dynamic";

import { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// services
import pagesService from "services/pages.service";
import issuesService from "services/issues.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { GptAssistantModal } from "components/core";
import { CreateUpdateBlockInline } from "components/pages";
// ui
import { CustomMenu, Input, Loader } from "components/ui";
// icons
import { LayerDiagonalIcon } from "components/icons";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import {
  BoltIcon,
  CheckIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { IIssue, IPageBlock, IProject } from "types";
// fetch-keys
import { PAGE_BLOCKS_LIST } from "constants/fetch-keys";
import { Draggable } from "react-beautiful-dnd";

type Props = {
  block: IPageBlock;
  projectDetails: IProject | undefined;
  index: number;
};

const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), {
  ssr: false,
  loading: () => (
    <Loader className="mx-4 mt-6">
      <Loader.Item height="100px" width="100%" />
    </Loader>
  ),
});

export const SinglePageBlock: React.FC<Props> = ({ block, projectDetails, index }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [createBlockForm, setCreateBlockForm] = useState(false);

  const [gptAssistantModal, setGptAssistantModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;

  const { setToastAlert } = useToast();

  const { handleSubmit, watch, reset, setValue, control, register } = useForm<IPageBlock>({
    defaultValues: {
      name: "",
      description: {},
      description_html: "<p></p>",
    },
  });

  const updatePageBlock = async (formData: Partial<IPageBlock>) => {
    if (!workspaceSlug || !projectId || !pageId) return;

    if (!formData.name || formData.name.length === 0 || formData.name === "") return;

    if (block.issue && block.sync) setIsSyncing(true);

    mutate<IPageBlock[]>(
      PAGE_BLOCKS_LIST(pageId as string),
      (prevData) =>
        prevData?.map((p) => {
          if (p.id === block.id) return { ...p, ...formData };

          return p;
        }),
      false
    );

    await pagesService
      .patchPageBlock(workspaceSlug as string, projectId as string, pageId as string, block.id, {
        name: formData.name,
        description: formData.description,
        description_html: formData.description_html,
      })
      .then((res) => {
        mutate(PAGE_BLOCKS_LIST(pageId as string));
        if (block.issue && block.sync)
          issuesService
            .patchIssue(workspaceSlug as string, projectId as string, block.issue, {
              name: res.name,
              description: res.description,
              description_html: res.description_html,
            })
            .finally(() => setIsSyncing(false));
      });
  };

  const pushBlockIntoIssues = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;

    await pagesService
      .convertPageBlockToIssue(
        workspaceSlug as string,
        projectId as string,
        pageId as string,
        block.id
      )
      .then((res: IIssue) => {
        mutate<IPageBlock[]>(
          PAGE_BLOCKS_LIST(pageId as string),
          (prevData) =>
            (prevData ?? []).map((p) => {
              if (p.id === block.id) return { ...p, issue: res.id, issue_detail: res };

              return p;
            }),
          false
        );

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Page block converted to issue successfully.",
        });
      })
      .catch((res) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Page block could not be converted to issue. Please try again.",
        });
      });
  };

  const deletePageBlock = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;

    mutate<IPageBlock[]>(
      PAGE_BLOCKS_LIST(pageId as string),
      (prevData) => (prevData ?? []).filter((p) => p.id !== block.id),
      false
    );

    await pagesService
      .deletePageBlock(workspaceSlug as string, projectId as string, pageId as string, block.id)
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Page could not be deleted. Please try again.",
        });
      });
  };

  const handleAiAssistance = async (response: string) => {
    if (!workspaceSlug || !projectId) return;

    setValue("description", {});
    setValue("description_html", `${watch("description_html")}<p>${response}</p>`);
    handleSubmit(updatePageBlock)()
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Block description updated successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Block description could not be updated. Please try again.",
        });
      });
  };

  const handleBlockSync = () => {
    if (!workspaceSlug || !projectId || !pageId) return;

    mutate<IPageBlock[]>(
      PAGE_BLOCKS_LIST(pageId as string),
      (prevData) =>
        (prevData ?? []).map((p) => {
          if (p.id === block.id) return { ...p, sync: !block.sync };

          return p;
        }),
      false
    );

    pagesService.patchPageBlock(
      workspaceSlug as string,
      projectId as string,
      pageId as string,
      block.id,
      {
        sync: !block.sync,
      }
    );
  };

  const handleCopyText = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(
      `${originURL}/${workspaceSlug}/projects/${projectId}/issues/${block.issue}`
    ).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  useEffect(() => {
    if (!block) return;

    reset({ ...block });
  }, [reset, block]);

  return (
    <Draggable draggableId={block.id} index={index}>
      {(provided, snapshot) => (
        <>
          {createBlockForm ? (
            <div className="mb-4">
              <CreateUpdateBlockInline
                handleClose={() => setCreateBlockForm(false)}
                data={block}
                setIsSyncing={setIsSyncing}
              />
            </div>
          ) : (
            <div
              className={`group ${
                snapshot.isDragging
                  ? "border-2 bg-white border-theme shadow-lg rounded-md p-4 pl-0"
                  : ""
              }`}
              ref={provided.innerRef}
              {...provided.draggableProps}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex p-0.5 hover:bg-gray-100 rounded opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                    {...provided.dragHandleProps}
                  >
                    <EllipsisVerticalIcon className="h-[18px]" />
                    <EllipsisVerticalIcon className="h-[18px] -ml-3" />
                  </button>
                  <h3 className="font-medium" onClick={() => setCreateBlockForm(true)}>
                    {block.name}
                  </h3>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {block.issue && block.sync && (
                    <div className="flex flex-shrink-0 cursor-default items-center gap-1 rounded bg-gray-100 py-1 px-1.5 text-xs">
                      {isSyncing ? (
                        <ArrowPathIcon className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckIcon className="h-3 w-3" />
                      )}
                      {isSyncing ? "Syncing..." : "Synced"}
                    </div>
                  )}
                  {block.issue && (
                    <Link href={`/${workspaceSlug}/projects/${projectId}/issues/${block.issue}`}>
                      <a className="flex flex-shrink-0 items-center gap-1 rounded bg-gray-100 px-1.5 py-1 text-xs">
                        <LayerDiagonalIcon height="16" width="16" color="black" />
                        {projectDetails?.identifier}-{block.issue_detail?.sequence_id}
                      </a>
                    </Link>
                  )}
                  <button
                    type="button"
                    className="-mr-2 flex items-center gap-1 rounded px-1.5 py-1 text-xs hover:bg-gray-100"
                    onClick={() => setGptAssistantModal((prevData) => !prevData)}
                  >
                    <SparklesIcon className="h-4 w-4" />
                    AI
                  </button>
                  <button
                    type="button"
                    className="-mr-2 flex items-center gap-1 rounded px-1.5 py-1 text-xs hover:bg-gray-100"
                    onClick={() => setCreateBlockForm(true)}
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                  <CustomMenu label={<BoltIcon className="h-4.5 w-3.5" />} noBorder noChevron>
                    {block.issue ? (
                      <>
                        <CustomMenu.MenuItem onClick={handleBlockSync}>
                          <>Turn sync {block.sync ? "off" : "on"}</>
                        </CustomMenu.MenuItem>
                        <CustomMenu.MenuItem onClick={handleCopyText}>
                          Copy issue link
                        </CustomMenu.MenuItem>
                      </>
                    ) : (
                      <CustomMenu.MenuItem onClick={pushBlockIntoIssues}>
                        Push into issues
                      </CustomMenu.MenuItem>
                    )}
                    <CustomMenu.MenuItem onClick={deletePageBlock}>
                      Delete block
                    </CustomMenu.MenuItem>
                  </CustomMenu>
                </div>
              </div>
              <div
                className="page-block-section font relative -mx-3 -mt-3 ml-6"
                onClick={() => setCreateBlockForm(true)}
              >
                <Controller
                  name="description"
                  control={control}
                  render={({ field: { value } }) => (
                    <RemirrorRichTextEditor
                      value={
                        !value || (typeof value === "object" && Object.keys(value).length === 0)
                          ? watch("description_html")
                          : value
                      }
                      placeholder="Description"
                      customClassName="text-sm"
                      noBorder
                      borderOnFocus={false}
                      editable={false}
                    />
                  )}
                />
                <GptAssistantModal
                  block={block}
                  isOpen={gptAssistantModal}
                  handleClose={() => setGptAssistantModal(false)}
                  inset="top-2 left-0"
                  content={block.description_stripped}
                  htmlContent={block.description_html}
                  onResponse={handleAiAssistance}
                  projectId={projectId as string}
                />
              </div>
            </div>
          )}
        </>
      )}
    </Draggable>
  );
};
