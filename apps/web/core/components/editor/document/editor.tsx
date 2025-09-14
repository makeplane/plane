import React, { forwardRef } from "react";
// plane imports
import {
  DocumentEditorWithRef,
  IEditorPropsExtended,
  type EditorRefApi,
  type IDocumentEditorProps,
  type TFileHandler,
} from "@plane/editor";
import { MakeOptional, TSearchEntityRequestPayload, TSearchResponse } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useEditorConfig, useEditorMention } from "@/hooks/editor";
import { useMember } from "@/hooks/store/use-member";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
// local imports
import { EditorMentionsRoot } from "../embeds/mentions";

type DocumentEditorWrapperProps = MakeOptional<
  Omit<IDocumentEditorProps, "fileHandler" | "mentionHandler" | "user" | "extendedEditorProps">,
  "disabledExtensions" | "editable" | "flaggedExtensions"
> & {
  extendedEditorProps?: Partial<IEditorPropsExtended>;
  workspaceSlug: string;
  workspaceId: string;
  projectId?: string;
} & (
    | {
        editable: false;
      }
    | {
        editable: true;
        searchMentionCallback: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
        uploadFile: TFileHandler["upload"];
      }
  );

export const DocumentEditor = forwardRef<EditorRefApi, DocumentEditorWrapperProps>((props, ref) => {
  const {
    containerClassName,
    editable,
    extendedEditorProps,
    workspaceSlug,
    workspaceId,
    projectId,
    disabledExtensions: additionalDisabledExtensions = [],
    ...rest
  } = props;
  // store hooks
  const { getUserDetails } = useMember();
  // editor flaggings
  const { document: documentEditorExtensions } = useEditorFlagging({
    workspaceSlug: workspaceSlug?.toString() ?? "",
  });
  // use editor mention
  const { fetchMentions } = useEditorMention({
    searchEntity: editable ? async (payload) => await props.searchMentionCallback(payload) : async () => ({}),
  });
  // editor config
  const { getEditorFileHandlers } = useEditorConfig();

  return (
    <DocumentEditorWithRef
      ref={ref}
      disabledExtensions={[...documentEditorExtensions.disabled, ...(additionalDisabledExtensions ?? [])]}
      editable={editable}
      flaggedExtensions={documentEditorExtensions.flagged}
      fileHandler={getEditorFileHandlers({
        projectId,
        uploadFile: editable ? props.uploadFile : async () => "",
        workspaceId,
        workspaceSlug,
      })}
      mentionHandler={{
        searchCallback: async (query) => {
          const res = await fetchMentions(query);
          if (!res) throw new Error("Failed in fetching mentions");
          return res;
        },
        renderComponent: EditorMentionsRoot,
        getMentionedEntityDetails: (id: string) => ({ display_name: getUserDetails(id)?.display_name ?? "" }),
      }}
      extendedEditorProps={extendedEditorProps}
      {...rest}
      containerClassName={cn("relative pl-3 pb-3", containerClassName)}
    />
  );
});

DocumentEditor.displayName = "DocumentEditor";
