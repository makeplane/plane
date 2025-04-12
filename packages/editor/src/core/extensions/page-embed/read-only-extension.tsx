import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
// types
import { TPageEmbedConfig } from "@/types";
// extension config
import { PageEmbedExtensionConfig } from "./extension-config";

type Props = {
  widgetCallback: TPageEmbedConfig["widgetCallback"];
};

export const PageEmbedReadOnlyExtension = (props: Props) =>
  PageEmbedExtensionConfig.extend({
    selectable: false,
    draggable: false,

    addNodeView() {
      return ReactNodeViewRenderer((embedProps: any) => (
        <NodeViewWrapper>
          {props.widgetCallback({
            pageId: embedProps.node.attrs.entity_identifier,
            workspaceSlug: embedProps.node.attrs.workspace_identifier,
          })}
        </NodeViewWrapper>
      ));
    },
  });
