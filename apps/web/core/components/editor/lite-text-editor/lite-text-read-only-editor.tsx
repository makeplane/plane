import React from "react";
// plane imports
import { NodeViewProps } from "@tiptap/react";
import { EditorReadOnlyRefApi, ILiteTextReadOnlyEditorProps, LiteTextReadOnlyEditorWithRef } from "@plane/editor";
import { MakeOptional } from "@plane/types";
// components
import { cn } from "@plane/utils";
import { EditorMentionsRoot } from "@/components/editor";
// helpers
// hooks
import { useEditorConfig } from "@/hooks/editor";
// store hooks
import { useMember } from "@/hooks/store";
// plane web hooks
import { EmbedHandler } from "@/plane-web/components/editor/external-embed/embed-handler";
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";

type LiteTextReadOnlyEditorWrapperProps = MakeOptional<
  Omit<ILiteTextReadOnlyEditorProps, "fileHandler" | "mentionHandler" | "embedHandler">,
  "disabledExtensions" | "flaggedExtensions"
> & {
  workspaceId: string;
  workspaceSlug: string;
  projectId?: string;
};

export const LiteTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, LiteTextReadOnlyEditorWrapperProps>(
  ({ workspaceId, workspaceSlug, projectId, disabledExtensions: additionalDisabledExtensions, ...props }, ref) => {
    // store hooks
    const { getUserDetails } = useMember();

    // editor flaggings
    const { liteText: liteTextEditorExtensions } = useEditorFlagging(workspaceSlug?.toString());
    // editor config
    const { getReadOnlyEditorFileHandlers } = useEditorConfig();
    const embedHandlerConfig = {
      externalEmbedComponent: { widgetCallback: (props: NodeViewProps) => <EmbedHandler {...props} /> },
    };
    return (
      <LiteTextReadOnlyEditorWithRef
        ref={ref}
        disabledExtensions={[...liteTextEditorExtensions.disabled, ...(additionalDisabledExtensions ?? [])]}
        flaggedExtensions={liteTextEditorExtensions.flagged}
        fileHandler={getReadOnlyEditorFileHandlers({
          projectId,
          workspaceId,
          workspaceSlug,
        })}
        mentionHandler={{
          renderComponent: (props) => <EditorMentionsRoot {...props} />,
          getMentionedEntityDetails: (id: string) => ({ display_name: getUserDetails(id)?.display_name ?? "" }),
        }}
        {...props}
        embedHandler={embedHandlerConfig}
        // overriding the containerClassName to add relative class passed
        containerClassName={cn(props.containerClassName, "relative p-2")}
      />
    );
  }
);

LiteTextReadOnlyEditor.displayName = "LiteTextReadOnlyEditor";
