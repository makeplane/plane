import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
// plane editor
import { EditorRefApi } from "@plane/editor";
// plane types
import { TSticky } from "@plane/types";
// plane utils
import { cn, isCommentEmpty } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store";
// components
import { StickyEditor } from "../../editor";

type TProps = {
  stickyData: Partial<TSticky> | undefined;
  workspaceSlug: string;
  handleUpdate: (payload: Partial<TSticky>) => void;
  stickyId: string | undefined;
  showToolbar?: boolean;
  handleChange: (data: Partial<TSticky>) => Promise<void>;
  handleDelete: () => void;
};

export const StickyInput = (props: TProps) => {
  const { stickyData, workspaceSlug, handleUpdate, stickyId, handleDelete, handleChange, showToolbar } = props;
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // navigation
  const pathname = usePathname();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id?.toString() ?? "";
  const isStickiesPage = pathname?.includes("stickies");
  // form info
  const { handleSubmit, reset, control } = useForm<TSticky>({
    defaultValues: {
      description_html: stickyData?.description_html,
    },
  });
  // handle description update
  const handleFormSubmit = useCallback(
    async (formdata: Partial<TSticky>) => {
      await handleUpdate({
        description_html: formdata.description_html ?? "<p></p>",
      });
    },
    [handleUpdate]
  );
  // reset form values
  useEffect(() => {
    if (!stickyId) return;
    reset({
      id: stickyId,
      description_html: stickyData?.description_html?.trim() === "" ? "<p></p>" : stickyData?.description_html,
    });
  }, [stickyData, stickyId, reset]);

  return (
    <div className="flex-1">
      <Controller
        name="description_html"
        control={control}
        render={({ field: { onChange } }) => (
          <StickyEditor
            id={`description-${stickyId}`}
            initialValue={stickyData?.description_html ?? ""}
            value={null}
            workspaceSlug={workspaceSlug}
            workspaceId={workspaceId}
            onChange={(_description, description_html) => {
              onChange(description_html);
              handleSubmit(handleFormSubmit)();
            }}
            placeholder={(_, value) => {
              const isContentEmpty = isCommentEmpty(value);
              if (!isContentEmpty) return "";
              return "Click to type here";
            }}
            containerClassName={cn(
              "w-full min-h-[256px] max-h-[540px] overflow-y-scroll vertical-scrollbar scrollbar-sm p-4 text-base",
              {
                "max-h-[588px]": isStickiesPage,
              }
            )}
            uploadFile={async () => ""}
            showToolbar={showToolbar}
            parentClassName="border-none p-0"
            handleDelete={handleDelete}
            handleColorChange={handleChange}
            ref={editorRef}
          />
        )}
      />
    </div>
  );
};
