import React, { forwardRef } from "react";
// plane imports
import { RichTextEditorWithRef } from "@plane/editor";
import type { EditorRefApi, IRichTextEditorProps, TFileHandler } from "@plane/editor";
import type { MakeOptional } from "@plane/types";
// helpers
import { getEditorFileHandlers } from "@/helpers/editor.helper";
// hooks
import { useMember } from "@/hooks/store/use-member";
// plane web imports
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
// local imports
import { EditorMentionsRoot } from "./embeds/mentions";

type RichTextEditorWrapperProps = MakeOptional<
  Omit<IRichTextEditorProps, "editable" | "fileHandler" | "mentionHandler" | "extendedEditorProps">,
  "disabledExtensions" | "flaggedExtensions"
> & {
  anchor: string;
  workspaceId: string;
} & (
    | {
        editable: false;
      }
    | {
        editable: true;
        uploadFile: TFileHandler["upload"];
      }
  );

export const RichTextEditor = forwardRef<EditorRefApi, RichTextEditorWrapperProps>((props, ref) => {
  const {
    anchor,
    containerClassName,
    editable,
    workspaceId,
    disabledExtensions: additionalDisabledExtensions = [],
    ...rest
  } = props;
  const { getMemberById } = useMember();
  const { richText: richTextEditorExtensions } = useEditorFlagging(anchor);

  return (
    <RichTextEditorWithRef
      mentionHandler={{
        renderComponent: (props) => <EditorMentionsRoot {...props} />,
        getMentionedEntityDetails: (id: string) => ({
          display_name: getMemberById(id)?.member__display_name ?? "",
        }),
      }}
      ref={ref}
      disabledExtensions={[...richTextEditorExtensions.disabled, ...additionalDisabledExtensions]}
      editable={editable}
      fileHandler={getEditorFileHandlers({
        anchor,
        uploadFile: editable ? props.uploadFile : async () => "",
        workspaceId,
      })}
      flaggedExtensions={richTextEditorExtensions.flagged}
      extendedEditorProps={{}}
      {...rest}
      containerClassName={containerClassName}
      editorClassName="min-h-[100px] py-2 overflow-hidden"
      displayConfig={{ fontSize: "large-font" }}
    />
  );
});

RichTextEditor.displayName = "RichTextEditor";
