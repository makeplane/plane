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
import { CreateUpdateIssueModal } from "components/issues";
import { GptAssistantModal } from "components/core";
// ui
import { CustomMenu, Input, Loader, TextArea } from "components/ui";
// icons
import { LayerDiagonalIcon } from "components/icons";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import {
  BoltIcon,
  CheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { IIssue, IPageBlock, IProject } from "types";
// fetch-keys
import { PAGE_BLOCKS_LIST } from "constants/fetch-keys";

type Props = {
  block: IPageBlock;
  projectDetails: IProject | undefined;
};

const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), {
  ssr: false,
  loading: () => (
    <Loader className="mx-4 mt-6">
      <Loader.Item height="100px" width="100%" />
    </Loader>
  ),
});

export const SinglePageBlock: React.FC<Props> = ({ block, projectDetails }) => {
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [gptAssistantModal, setGptAssistantModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;

  const { setToastAlert } = useToast();

  const { handleSubmit, watch, reset, setValue, control } = useForm<IPageBlock>({
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

  const editAndPushBlockIntoIssues = async () => {
    setCreateUpdateIssueModal(true);
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
    <div>
      <CreateUpdateIssueModal
        isOpen={createUpdateIssueModal}
        handleClose={() => setCreateUpdateIssueModal(false)}
        prePopulateData={{
          name: watch("name"),
          description: watch("description"),
          description_html: watch("description_html"),
        }}
      />
      <div className="-mx-3 mt-4 flex items-center justify-between gap-2">
        <Input
          id="name"
          name="name"
          placeholder="Block title"
          value={watch("name")}
          onBlur={handleSubmit(updatePageBlock)}
          onChange={(e) => setValue("name", e.target.value)}
          required={true}
          className="min-h-10 block w-full resize-none overflow-hidden border-none bg-transparent py-1 text-base font-medium ring-0 focus:ring-1 focus:ring-gray-200"
          role="textbox"
        />
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
          <CustomMenu label={<BoltIcon className="h-4.5 w-3.5" />} noBorder noChevron>
            {block.issue ? (
              <>
                <CustomMenu.MenuItem onClick={handleBlockSync}>
                  <>Turn sync {block.sync ? "off" : "on"}</>
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={handleCopyText}>Copy issue link</CustomMenu.MenuItem>
              </>
            ) : (
              <>
                <CustomMenu.MenuItem onClick={pushBlockIntoIssues}>
                  Push into issues
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={editAndPushBlockIntoIssues}>
                  Edit and push into issues
                </CustomMenu.MenuItem>
              </>
            )}
            <CustomMenu.MenuItem onClick={deletePageBlock}>Delete block</CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>
      <div className="page-block-section font relative -mx-3 -mt-3">
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
              onBlur={handleSubmit(updatePageBlock)}
              onJSONChange={(jsonValue) => setValue("description", jsonValue)}
              onHTMLChange={(htmlValue) => setValue("description_html", htmlValue)}
              placeholder="Block description..."
              customClassName="border border-transparent"
              noBorder
              borderOnFocus
            />
          )}
        />
        <GptAssistantModal
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
  );
};
