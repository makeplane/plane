import { useCallback, useEffect, useRef } from "react";
import { DebouncedFunc } from "lodash";
import { Controller, useForm } from "react-hook-form";
import { EditorRefApi } from "@plane/editor";
import { TSticky } from "@plane/types";
import { TextArea } from "@plane/ui";
import { useWorkspace } from "@/hooks/store";
import { StickyEditor } from "../../editor";

type TProps = {
  stickyData: TSticky | undefined;
  workspaceSlug: string;
  handleUpdate: DebouncedFunc<(payload: Partial<TSticky>) => Promise<void>>;
  stickyId: string | undefined;
  handleChange: (data: Partial<TSticky>) => Promise<void>;
  handleDelete: () => void;
};
export const StickyInput = (props: TProps) => {
  const { stickyData, workspaceSlug, handleUpdate, stickyId, handleDelete, handleChange } = props;
  //refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // form info
  const { handleSubmit, reset, control } = useForm<TSticky>({
    defaultValues: {
      description_html: stickyData?.description_html,
      name: stickyData?.name,
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
      name: stickyData?.name,
    });
  }, [stickyData, reset]);

  const handleFormSubmit = useCallback(
    async (formdata: Partial<TSticky>) => {
      if (formdata.name !== undefined) {
        await handleUpdate({
          description_html: formdata.description_html ?? "<p></p>",
          name: formdata.name,
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
      {/* name */}
      <Controller
        name="name"
        control={control}
        render={({ field: { value, onChange } }) => (
          <TextArea
            value={value}
            id="name"
            name="name"
            onChange={(e) => {
              onChange(e.target.value);
              handleSubmit(handleFormSubmit)();
            }}
            placeholder="Title"
            className="text-lg font-medium text-[#455068] mb-2 w-full p-0 border-none min-h-[22px]"
          />
        )}
      />
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
            containerClassName={"px-0 text-base min-h-[200px] w-full text-[#455068]"}
            uploadFile={async () => ""}
            showToolbar={false}
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
