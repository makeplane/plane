import React from "react";
// plane imports
import { NodeViewProps } from "@tiptap/react";
import { EditorReadOnlyRefApi, ILiteTextReadOnlyEditorProps, LiteTextReadOnlyEditorWithRef } from "@plane/editor";
import { MakeOptional } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { EditorMentionsRoot } from "@/components/editor";
// helpers
import { getReadOnlyEditorFileHandlers } from "@/helpers/editor.helper";
// store hooks
import { useMember } from "@/hooks/store";
import { EmbedHandler } from "@/plane-web/components/editor/external-embed/embed-handler";

type LiteTextReadOnlyEditorWrapperProps = MakeOptional<
  Omit<ILiteTextReadOnlyEditorProps, "fileHandler" | "mentionHandler" | "embedHandler">,
  "disabledExtensions" | "flaggedExtensions"
> & {
  anchor: string;
  workspaceId: string;
};

export const LiteTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, LiteTextReadOnlyEditorWrapperProps>(
  ({ anchor, workspaceId, disabledExtensions, flaggedExtensions, ...props }, ref) => {
    const { getMemberById } = useMember();
    const embedHandlerConfig = {
      externalEmbedComponent: { widgetCallback: (props: NodeViewProps) => <EmbedHandler {...props} anchor={anchor} /> },
    };
    return (
      <LiteTextReadOnlyEditorWithRef
        ref={ref}
        disabledExtensions={disabledExtensions ?? []}
        flaggedExtensions={flaggedExtensions ?? []}
        fileHandler={getReadOnlyEditorFileHandlers({
          anchor,
          workspaceId,
        })}
        mentionHandler={{
          renderComponent: (props) => <EditorMentionsRoot {...props} />,
          getMentionedEntityDetails: (id: string) => ({
            display_name: getMemberById(id)?.member__display_name ?? "",
          }),
        }}
        embedHandler={embedHandlerConfig}
        {...props}
        // overriding the customClassName to add relative class passed
        containerClassName={cn(props.containerClassName, "relative p-2")}
      />
    );
  }
);

LiteTextReadOnlyEditor.displayName = "LiteTextReadOnlyEditor";
