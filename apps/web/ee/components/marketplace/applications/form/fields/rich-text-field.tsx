import { Control, Controller, FieldValues } from "react-hook-form";
import { TSearchEntityRequestPayload, TSearchResponse } from "@plane/types";
import { cn } from "@plane/ui";
import { RichTextEditor } from "@/components/editor/rich-text";
import { BaseFieldProps, FieldWrapper } from "./base-field";

type Props<T extends FieldValues> = BaseFieldProps<T> & {
  control: Control<T>;
  workspaceSlug: string;
  workspaceId: string;
  uploadFile?: (blockId: string, file: File) => Promise<string>;
  initialValue?: string;
  searchEntityCallback: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
};

export const RichTextField = <T extends FieldValues>(props: Props<T>) => {
  const {
    id,
    placeholder,
    tabIndex,
    className = "",
    control,
    validation,
    workspaceSlug,
    workspaceId,
    uploadFile,
    initialValue,
    searchEntityCallback,
    error,
  } = props;

  return (
    <FieldWrapper {...props}>
      <Controller
        name={id}
        control={control}
        rules={validation}
        render={({ field: { onChange } }) => (
          <RichTextEditor
            editable
            id={workspaceSlug}
            tabIndex={tabIndex}
            placeholder={placeholder}
            initialValue={initialValue ?? "<p></p>"}
            workspaceSlug={workspaceSlug}
            workspaceId={workspaceId}
            searchMentionCallback={async (payload) => await searchEntityCallback(payload)}
            dragDropEnabled={false}
            onChange={(_description: object, html: string) => onChange(html)}
            editorClassName="text-xs"
            containerClassName={cn(
              `resize-none min-h-24 text-xs border-[0.5px] border-custom-border-200 rounded-md px-3 py-2 resize-none text-sm bg-custom-background-100`,
              className,
              {
                "border-red-500": Boolean(error),
              }
            )}
            displayConfig={{ fontSize: "small-font" }}
            uploadFile={uploadFile ?? (() => Promise.reject())}
            disabledExtensions={["attachments"]}
          />
        )}
      />
    </FieldWrapper>
  );
};
