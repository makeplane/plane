import React, { forwardRef } from "react";
// plane imports
import { EditorRefApi, IRichTextEditor, RichTextEditorWithRef, TFileHandler } from "@plane/editor";
import { MakeOptional } from "@plane/types";
// components
import { EditorMentionsRoot } from "@/components/editor";
// helpers
import { getEditorFileHandlers } from "@/helpers/editor.helper";
// store hooks
import { useMember } from "@/hooks/store";

interface RichTextEditorWrapperProps
  extends MakeOptional<Omit<IRichTextEditor, "fileHandler" | "mentionHandler">, "disabledExtensions"> {
  anchor: string;
  uploadFile: TFileHandler["upload"];
  workspaceId: string;
}

export const RichTextEditor = forwardRef<EditorRefApi, RichTextEditorWrapperProps>((props, ref) => {
  const { anchor, containerClassName, uploadFile, workspaceId, disabledExtensions, ...rest } = props;
  const { getMemberById } = useMember();
  return (
    <RichTextEditorWithRef
      mentionHandler={{
        renderComponent: (props) => <EditorMentionsRoot {...props} />,
        getMentionedEntityDetails: (id: string) => ({
          display_name: getMemberById(id)?.member__display_name ?? "",
        }),
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
      editorClassName="min-h-[100px] max-h-[50vh] border border-gray-100 rounded-md pl-3 pb-3 overflow-y-scroll"
    />
  );
});

RichTextEditor.displayName = "RichTextEditor";
