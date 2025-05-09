import { ReactNodeViewRenderer, NodeViewWrapper, Editor } from "@tiptap/react";
// types
import { TPageEmbedConfig } from "@/types";
// extension config
import { PageEmbedExtensionAttributes, PageEmbedExtensionConfig } from "./extension-config";

type Props = {
  widgetCallback: TPageEmbedConfig["widgetCallback"];
};

export const PageEmbedReadOnlyExtension = (props: Props) =>
  PageEmbedExtensionConfig.extend({
    selectable: false,
    draggable: false,

    addNodeView() {
      return ReactNodeViewRenderer(
        (embedProps: {
          node: { attrs: PageEmbedExtensionAttributes };
          editor: Editor;
          updateAttributes: (attrs: Partial<PageEmbedExtensionAttributes>) => void;
        }) => (
          <NodeViewWrapper>
            {props.widgetCallback({
              pageId: embedProps.node.attrs.entity_identifier as string,
              workspaceSlug: embedProps.node.attrs.workspace_identifier,
            })}
          </NodeViewWrapper>
        )
      );
    },
  });
