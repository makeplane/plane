import { useEffect, useState } from "react";

import { useRouter } from "next/router";
import dynamic from "next/dynamic";

import { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// services
import pagesService from "services/pages.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { CustomMenu, Loader, TextArea } from "components/ui";
// icons
import { WaterDropIcon } from "components/icons";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { IPageBlock } from "types";
// fetch-keys
import { PAGE_BLOCKS_LIST } from "constants/fetch-keys";
import { CreateUpdateIssueModal } from "components/issues";

type Props = {
  block: IPageBlock;
};

const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), {
  ssr: false,
  loading: () => (
    <Loader>
      <Loader.Item height="100px" width="100%" />
    </Loader>
  ),
});

export const SinglePageBlock: React.FC<Props> = ({ block }) => {
  const [createUpdateIssueModal, setCreateUpdateIssueModal] = useState(false);

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

    mutate<IPageBlock[]>(
      PAGE_BLOCKS_LIST(pageId as string),
      (prevData) =>
        prevData?.map((p) => {
          if (p.id === block.id) return { ...p, ...formData };

          return p;
        }),
      false
    );

    await pagesService.patchPageBlock(
      workspaceSlug as string,
      projectId as string,
      pageId as string,
      block.id,
      {
        name: formData.name,
        description: formData.description,
        description_html: formData.description_html,
      }
    );
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
      .then((res) => {
        mutate<IPageBlock[]>(
          PAGE_BLOCKS_LIST(pageId as string),
          (prevData) =>
            (prevData ?? []).map((p) => {
              if (p.id === block.id) return { ...p, issue: res.id };

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
      <div className="-mx-3 -mt-2 flex items-center justify-between gap-2">
        <TextArea
          id="name"
          name="name"
          placeholder="Enter issue name"
          value={watch("name")}
          onBlur={handleSubmit(updatePageBlock)}
          onChange={(e) => setValue("name", e.target.value)}
          required={true}
          className="min-h-10 block w-full resize-none overflow-hidden border-none bg-transparent text-base font-medium"
          role="textbox"
          disabled={block.issue ? true : false}
        />
        <CustomMenu label={<WaterDropIcon width={14} height={15} />} noBorder noChevron>
          {block.issue ? (
            <CustomMenu.MenuItem onClick={handleCopyText}>Copy issue link</CustomMenu.MenuItem>
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
      <div className="page-block-section -mx-3 -mt-5">
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
              placeholder="Description..."
              editable={block.issue ? false : true}
              customClassName="text-gray-500"
              noBorder
            />
          )}
        />
      </div>
    </div>
  );
};
