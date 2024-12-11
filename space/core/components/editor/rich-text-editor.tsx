import React, { forwardRef } from "react";
// editor
import { EditorRefApi, IMentionHighlight, IRichTextEditor, RichTextEditorWithRef } from "@plane/editor";
// helpers
import { getEditorFileHandlers } from "@/helpers/editor.helper";

interface RichTextEditorWrapperProps
  extends Omit<IRichTextEditor, "disabledExtensions" | "fileHandler" | "mentionHandler"> {
  uploadFile: (file: File) => Promise<string>;
}

export const RichTextEditor = forwardRef<EditorRefApi, RichTextEditorWrapperProps>((props, ref) => {
  const { containerClassName, uploadFile, ...rest } = props;
  // store hooks

  // use-mention

  // file size

  return (
    <RichTextEditorWithRef
      mentionHandler={{
        highlights: function (): Promise<IMentionHighlight[]> {
          throw new Error("Function not implemented.");
        },
        suggestions: undefined,
      }}
      ref={ref}
      disabledExtensions={[]}
      fileHandler={getEditorFileHandlers({
        uploadFile,
        workspaceId: "",
        anchor: "",
      })}
      {...rest}
      containerClassName={containerClassName}
      editorClassName="min-h-[100px] max-h-[50vh] border border-gray-100 rounded-md pl-3 pb-3 overflow-y-scroll"
    />
  );
});

RichTextEditor.displayName = "RichTextEditor";
