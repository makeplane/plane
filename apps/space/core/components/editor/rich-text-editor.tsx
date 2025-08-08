import React, { forwardRef } from "react";
// plane imports
import {
  EditorRefApi,
  IRichTextEditorProps,
  RichTextEditorWithRef,
  TFileHandler,
  type NodeViewProps,
} from "@plane/editor";
import { MakeOptional } from "@plane/types";
// components
import { EditorMentionsRoot } from "@/components/editor";
// helpers
import { getEditorFileHandlers } from "@/helpers/editor.helper";
// store hooks
import { useMember } from "@/hooks/store";
import { EmbedHandler } from "@/plane-web/components/editor/external-embed/embed-handler";
import { useEditorFlagging } from "ce/hooks/use-editor-flagging";

type RichTextEditorWrapperProps = MakeOptional<
  Omit<IRichTextEditorProps, "editable" | "fileHandler" | "mentionHandler" | "embedHandler">,
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
      {...rest}
      embedHandler={{
        externalEmbedComponent: {
          widgetCallback: (props: NodeViewProps) => <EmbedHandler anchor={anchor} {...props} />,
        },
      }}
      containerClassName={containerClassName}
      editorClassName="min-h-[100px] max-h-[200px] border-[0.5px] border-custom-border-300 rounded-md pl-3 py-2 overflow-hidden"
      displayConfig={{ fontSize: "large-font" }}
    />
  );
});

RichTextEditor.displayName = "RichTextEditor";
