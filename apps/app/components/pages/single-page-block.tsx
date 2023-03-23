import { useRouter } from "next/router";

import { mutate } from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// services
import pagesService from "services/pages.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { CustomMenu, TextArea } from "components/ui";
// types
import { IPageBlock } from "types";
// fetch-keys
import { PAGE_BLOCK_LIST } from "constants/fetch-keys";
import { useEffect } from "react";

type Props = {
  pageBlock: IPageBlock;
};

export const SinglePageBlock: React.FC<Props> = ({ pageBlock }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;

  const { handleSubmit, watch, reset, setValue } = useForm<IPageBlock>({
    defaultValues: {
      name: "",
    },
  });

  const { setToastAlert } = useToast();

  const updatePageBlock = async (formData: IPageBlock) => {
    if (!workspaceSlug || !projectId || !pageId) return;

    if (!formData.name || formData.name.length === 0 || formData.name === "") return;

    mutate<IPageBlock[]>(
      PAGE_BLOCK_LIST(pageId as string),
      (prevData) =>
        prevData?.map((p) => {
          if (p.id === pageBlock.id) return { ...p, ...formData };

          return p;
        }),
      false
    );

    await pagesService.patchPageBlock(
      workspaceSlug as string,
      projectId as string,
      pageId as string,
      pageBlock.id,
      {
        name: formData.name,
      }
    );
  };

  const deletePageBlock = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;

    await pagesService
      .deletePageBlock(workspaceSlug as string, projectId as string, pageId as string, pageBlock.id)
      .then(() => {
        mutate(PAGE_BLOCK_LIST(pageId as string));
        console.log("deleted block");
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Page could not be deleted. Please try again.",
        });
      });
  };

  useEffect(() => {
    if (!pageBlock) return;

    reset({ ...pageBlock });
  }, [reset, pageBlock]);

  return (
    <div>
      <div className="-mx-3 -mt-2">
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
        />
      </div>
      <div className="-mx-3 -mt-2">
        <TextArea
          id="name"
          name="name"
          placeholder="Enter issue name"
          value={watch("description")}
          onBlur={handleSubmit(updatePageBlock)}
          onChange={(e) => setValue("name", e.target.value)}
          required={true}
          className="min-h-10 block w-full resize-none overflow-hidden border-none bg-transparent text-base font-medium"
          role="textbox"
        />
      </div>
    </div>
  );
};
