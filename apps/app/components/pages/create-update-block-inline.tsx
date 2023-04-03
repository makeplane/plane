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
import { Input, Loader, PrimaryButton, SecondaryButton } from "components/ui";
// types
import { IPageBlock } from "types";
// fetch-keys
import { PAGE_BLOCKS_LIST } from "constants/fetch-keys";
import { useCallback, useEffect } from "react";
import issuesService from "services/issues.service";

type Props = {
  handleClose: () => void;
  data?: IPageBlock;
  setIsSyncing?: React.Dispatch<React.SetStateAction<boolean>>;
};

const defaultValues = {
  name: "",
  description: "<p></p>",
};

const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), {
  ssr: false,
  loading: () => (
    <Loader className="mx-4 mt-6">
      <Loader.Item height="100px" width="100%" />
    </Loader>
  ),
});

export const CreateUpdateBlockInline: React.FC<Props> = ({ handleClose, data, setIsSyncing }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;

  const { setToastAlert } = useToast();

  const {
    handleSubmit,
    register,
    control,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<IPageBlock>({
    defaultValues,
  });

  const onClose = useCallback(() => {
    handleClose();
    reset();
  }, [handleClose, reset]);

  const createPageBlock = async (formData: Partial<IPageBlock>) => {
    if (!workspaceSlug || !projectId || !pageId) return;

    await pagesService
      .createPageBlock(workspaceSlug as string, projectId as string, pageId as string, {
        name: formData.name,
        description: formData.description ?? "",
        description_html: formData.description_html ?? "<p></p>",
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
      })
      .finally(() => onClose());
  };

  const updatePageBlock = async (formData: Partial<IPageBlock>) => {
    if (!workspaceSlug || !projectId || !pageId || !data) return;

    if (data.issue && data.sync && setIsSyncing) setIsSyncing(true);

    mutate<IPageBlock[]>(
      PAGE_BLOCKS_LIST(pageId as string),
      (prevData) =>
        prevData?.map((p) => {
          if (p.id === data.id) return { ...p, ...formData };

          return p;
        }),
      false
    );

    await pagesService
      .patchPageBlock(workspaceSlug as string, projectId as string, pageId as string, data.id, {
        name: formData.name,
        description: formData.description,
        description_html: formData.description_html,
      })
      .then((res) => {
        mutate(PAGE_BLOCKS_LIST(pageId as string));
        if (data.issue && data.sync)
          issuesService
            .patchIssue(workspaceSlug as string, projectId as string, data.issue, {
              name: res.name,
              description: res.description,
              description_html: res.description_html,
            })
            .finally(() => {
              if (setIsSyncing) setIsSyncing(false);
            });
      })
      .finally(() => onClose());
  };

  useEffect(() => {
    if (!data) return;

    reset({
      ...defaultValues,
      name: data.name,
      description: data.description,
      description_html: data.description_html,
    });
  }, [reset, data]);

  useEffect(() => {
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    });

    return () => {
      window.removeEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      });
    };
  }, [onClose]);

  return (
    <div className="border rounded-[10px] p-2 ml-6">
      <form onSubmit={data ? handleSubmit(updatePageBlock) : handleSubmit(createPageBlock)}>
        <Input
          id="name"
          name="name"
          placeholder="Title"
          register={register}
          required={true}
          className="min-h-10 block w-full resize-none overflow-hidden border-none bg-transparent py-1 text-base ring-0 -ml-2 focus:ring-gray-200"
          role="textbox"
        />
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
                onJSONChange={(jsonValue) => setValue("description", jsonValue)}
                onHTMLChange={(htmlValue) => setValue("description_html", htmlValue)}
                placeholder="Description"
                customClassName="text-sm"
                noBorder
                borderOnFocus={false}
              />
            )}
          />
        </div>
        <div className="flex justify-end items-center gap-2">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" loading={isSubmitting}>
            {data
              ? isSubmitting
                ? "Updating..."
                : "Update block"
              : isSubmitting
              ? "Adding..."
              : "Add block"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
};
