import React, { KeyboardEventHandler, useCallback, useEffect, useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

// react-hook-form
import { useForm } from "react-hook-form";
// services
import pagesService from "services/pages.service";

// hooks
import useToast from "hooks/use-toast";
// ui
import { TextArea } from "components/ui";
// types
import { IPageBlock } from "types";
// fetch-keys
import { PAGE_BLOCKS_LIST } from "constants/fetch-keys";

const defaultValues = {
  name: "",
};

export const CreateBlock = () => {
  const [blockTitle, setBlockTitle] = useState("");

  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;

  const { setToastAlert } = useToast();

  const {
    handleSubmit,
    register,
    control,
    watch,
    setValue,
    setFocus,
    reset,
    formState: { isSubmitting },
  } = useForm<IPageBlock>({
    defaultValues,
  });

  const createPageBlock = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;

    await pagesService
      .createPageBlock(workspaceSlug as string, projectId as string, pageId as string, {
        name: watch("name"),
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

    reset();
  };

  const handleKeyDown = (e: any) => {
    const keyCombination =
      ((e.ctrlKey || e.metaKey) && e.key === "Enter") || (e.shiftKey && e.key === "Enter");

    if (e.key === "Enter" && !keyCombination) {
      if (watch("name") && watch("name") !== "") {
        e.preventDefault();
        createPageBlock();
        reset();
      }
    }
  };

  return (
    <div className="relative">
      <form
        className="flex flex-col items-center justify-between rounded border-2 border-brand-base p-2"
        onSubmit={handleSubmit(createPageBlock)}
      >
        <div className="flex min-h-[75px] w-full">
          <TextArea
            id="name"
            name="name"
            placeholder="Title"
            register={register}
            className="min-h-[20px] block max-h-24 w-full resize-none overflow-hidden border-none bg-transparent px-1 py-1 text-sm font-medium"
            role="textbox"
            onKeyDown={handleKeyDown}
            maxLength={255}
            noPadding
          />
        </div>

        <div className="flex w-full items-center justify-end gap-2 p-1">
          <button type="submit">
            <PaperAirplaneIcon className="h-5 w-5 text-brand-base" />
          </button>
        </div>
      </form>
    </div>
  );
};
