import React, { forwardRef } from "react";
// plane imports
import { EditorRefApi, IRichTextEditorProps, RichTextEditorWithRef, TFileHandler } from "@plane/editor";
import { MakeOptional } from "@plane/types";
// components
import { EditorMentionsRoot } from "@/components/editor";
// helpers
import { getEditorFileHandlers } from "@/helpers/editor.helper";
// store hooks
import { useMember } from "@/hooks/store";

interface RichTextEditorWrapperProps
  extends MakeOptional<
    Omit<IRichTextEditorProps, "fileHandler" | "mentionHandler">,
    "disabledExtensions" | "flaggedExtensions"
  > {
  anchor: string;
  uploadFile: TFileHandler["upload"];
  workspaceId: string;
}

export const RichTextEditor = forwardRef<EditorRefApi, RichTextEditorWrapperProps>((props, ref) => {
  const { anchor, containerClassName, uploadFile, workspaceId, disabledExtensions, flaggedExtensions, ...rest } = props;
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
      flaggedExtensions={flaggedExtensions ?? []}
      {...rest}
      containerClassName={containerClassName}
      editorClassName="min-h-[100px] max-h-[200px] border-[0.5px] border-custom-border-300 rounded-md pl-3 py-2 overflow-hidden"
      displayConfig={{ fontSize: "large-font" }}
    />
  );
});

RichTextEditor.displayName = "RichTextEditor";
