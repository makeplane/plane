import React, { forwardRef } from "react";
// plane editor
import { EditorRefApi, IMentionHighlight, IRichTextEditor, RichTextEditorWithRef } from "@plane/editor";
// helpers
import { getEditorFileHandlers } from "@/helpers/editor.helper";

interface RichTextEditorWrapperProps
  extends Omit<IRichTextEditor, "disabledExtensions" | "fileHandler" | "mentionHandler"> {
  anchor: string;
  uploadFile: (file: File) => Promise<string>;
  workspaceId: string;
}

export const RichTextEditor = forwardRef<EditorRefApi, RichTextEditorWrapperProps>((props, ref) => {
  const { anchor, containerClassName, uploadFile, workspaceId, ...rest } = props;

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
        workspaceId,
        anchor,
      })}
      {...rest}
      containerClassName={containerClassName}
      editorClassName="min-h-[100px] max-h-[50vh] border-[0.5px] border-custom-border-200 rounded-md pl-3 pb-3 overflow-y-scroll"
    />
  );
});

RichTextEditor.displayName = "RichTextEditor";
