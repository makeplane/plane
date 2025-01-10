import { useCallback, useEffect, useRef } from "react";
import { DebouncedFunc } from "lodash";
import { Controller, useForm } from "react-hook-form";
import { EditorRefApi } from "@plane/editor";
import { TSticky } from "@plane/types";
import { useWorkspace } from "@/hooks/store";
import { StickyEditor } from "../../editor";

type TProps = {
  stickyData: TSticky | undefined;
  workspaceSlug: string;
  handleUpdate: DebouncedFunc<(payload: Partial<TSticky>) => Promise<void>>;
  stickyId: string | undefined;
  showToolbar?: boolean;
  handleChange: (data: Partial<TSticky>) => Promise<void>;
  handleDelete: () => void;
};
export const StickyInput = (props: TProps) => {
  const { stickyData, workspaceSlug, handleUpdate, stickyId, handleDelete, handleChange, showToolbar } = props;
  //refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // form info
  const { handleSubmit, reset, control } = useForm<TSticky>({
    defaultValues: {
      description_html: stickyData?.description_html,
    },
  });

  // computed values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id as string;

  // reset form values
  useEffect(() => {
    if (!stickyId) return;
    reset({
      id: stickyId,
      description_html: stickyData?.description_html === "" ? "<p></p>" : stickyData?.description_html,
    });
  }, [stickyData, reset]);

  const handleFormSubmit = useCallback(
    async (formdata: Partial<TSticky>) => {
      if (formdata.name !== undefined) {
        await handleUpdate({
          description_html: formdata.description_html ?? "<p></p>",
        });
      } else {
        await handleUpdate({
          description_html: formdata.description_html ?? "<p></p>",
        });
      }
    },
    [handleUpdate, workspaceSlug]
  );

  return (
    <div className="flex-1">
      {/* description */}
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
            onChange={(_description: object, description_html: string) => {
              onChange(description_html);
              handleSubmit(handleFormSubmit)();
            }}
            placeholder={"Click to type here"}
            containerClassName={"px-0 text-base min-h-[250px] w-full text-[#455068]"}
            uploadFile={async () => ""}
            showToolbar={showToolbar}
            parentClassName={"border-none p-0"}
            handleDelete={handleDelete}
            handleColorChange={handleChange}
            ref={editorRef}
          />
        )}
      />
    </div>
  );
};
