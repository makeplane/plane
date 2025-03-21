import React, { forwardRef } from "react";
// plane imports
import { EditorRefApi, IRichTextEditor, RichTextEditorWithRef, TFileHandler } from "@plane/editor";
import { MakeOptional } from "@plane/types";
// components
import { EditorMentionsRoot } from "@/components/editor";
// helpers
import { getEditorFileHandlers } from "@/helpers/editor.helper";

interface RichTextEditorWrapperProps
  extends MakeOptional<Omit<IRichTextEditor, "fileHandler" | "mentionHandler">, "disabledExtensions"> {
  anchor: string;
  uploadFile: TFileHandler["upload"];
  workspaceId: string;
}

export const RichTextEditor = forwardRef<EditorRefApi, RichTextEditorWrapperProps>((props, ref) => {
  const { anchor, containerClassName, uploadFile, workspaceId, disabledExtensions, ...rest } = props;

  return (
    <RichTextEditorWithRef
      mentionHandler={{
        renderComponent: (props) => <EditorMentionsRoot {...props} />,
      }}
      ref={ref}
      disabledExtensions={disabledExtensions ?? []}
      fileHandler={getEditorFileHandlers({
        anchor,
        uploadFile,
        workspaceId,
      })}
      {...rest}
      containerClassName={containerClassName}
      editorClassName="min-h-[100px] max-h-[50vh] border-[0.5px] border-custom-border-200 rounded-md pl-3 py-2 overflow-y-scroll"
    />
  );
});

RichTextEditor.displayName = "RichTextEditor";
