import React from "react";
// plane imports
import { NodeViewProps } from "@tiptap/react";
import { EditorReadOnlyRefApi, IRichTextReadOnlyEditorProps, RichTextReadOnlyEditorWithRef } from "@plane/editor";
import { MakeOptional } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { EditorMentionsRoot } from "@/components/editor";
// helpers
import { getReadOnlyEditorFileHandlers } from "@/helpers/editor.helper";
// store hooks
import { useMember } from "@/hooks/store";
import { EmbedHandler } from "@/plane-web/components/editor/external-embed/embed-handler";

type RichTextReadOnlyEditorWrapperProps = MakeOptional<
  Omit<IRichTextReadOnlyEditorProps, "fileHandler" | "mentionHandler" | "embedHandler">,
  "disabledExtensions" | "flaggedExtensions"
> & {
  anchor: string;
  workspaceId: string;
};

export const RichTextReadOnlyEditor = React.forwardRef<EditorReadOnlyRefApi, RichTextReadOnlyEditorWrapperProps>(
  ({ anchor, workspaceId, disabledExtensions, flaggedExtensions, ...props }, ref) => {
    const { getMemberById } = useMember();

    return (
      <RichTextReadOnlyEditorWithRef
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
        {...props}
        embedHandler={{
          externalEmbedComponent: {
            widgetCallback: (props: NodeViewProps) => <EmbedHandler anchor={anchor} {...props} />,
          },
        }}
        // overriding the customClassName to add relative class passed
        containerClassName={cn("relative p-0 border-none", props.containerClassName)}
      />
    );
  }
);

RichTextReadOnlyEditor.displayName = "RichTextReadOnlyEditor";
