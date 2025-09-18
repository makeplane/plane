import { Plugin, PluginKey } from "@tiptap/pm/state";
import { ReactNodeViewRenderer, NodeViewWrapper, type Editor } from "@tiptap/react";
// helpers
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// plane editor imports
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// types
import type { TPageEmbedConfig } from "@/types";
// extension config
import { pageEmbedCommands } from "./commands";
import { PageEmbedExtensionAttributes, PageEmbedExtensionConfig } from "./extension-config";
import { PageEmbedOrderTrackerPlugin } from "./plugins/order-tracker-plugin";
import { PreventPageEmbedDeletionPlugin } from "./plugins/prevent-deletion-page-embed";

type Props = {
  widgetCallback: TPageEmbedConfig["widgetCallback"];
  archivePage?: TPageEmbedConfig["archivePage"];
  unarchivePage?: TPageEmbedConfig["unarchivePage"];
  deletePage?: TPageEmbedConfig["deletePage"];
  getPageDetailsCallback?: TPageEmbedConfig["getPageDetailsCallback"];
  onNodesPosChanged?: TPageEmbedConfig["onNodesPosChanged"];
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    "page-embed-component": {
      insertPageEmbed: ({
        pageId,
        workspaceSlug,
        position,
      }: {
        pageId: string;
        workspaceSlug: string;
        position?: number;
      }) => ReturnType;
    };
  }
}

export const PageEmbedExtension = (props: Props) =>
  PageEmbedExtensionConfig.extend({
    selectable: true,
    draggable: true,

    addCommands() {
      return pageEmbedCommands(this.type);
    },

    addNodeView() {
      return ReactNodeViewRenderer(
        (embedProps: {
          node: { attrs: PageEmbedExtensionAttributes };
          editor: Editor;
          updateAttributes: (attrs: Partial<PageEmbedExtensionAttributes>) => void;
        }) => (
          <NodeViewWrapper className="page-embed-component">
            {props.widgetCallback({
              pageId: embedProps.node.attrs.entity_identifier as string,
              workspaceSlug: embedProps.node.attrs.workspace_identifier,
              editor: embedProps.editor,
              updateAttributes: embedProps.updateAttributes,
            })}
          </NodeViewWrapper>
        )
      );
    },

    addKeyboardShortcuts() {
      return {
        ArrowDown: insertEmptyParagraphAtNodeBoundaries("down", this.name),
        ArrowUp: insertEmptyParagraphAtNodeBoundaries("up", this.name),
      };
    },

    addProseMirrorPlugins(this) {
      return [
        PreventPageEmbedDeletionPlugin({
          nodeTypeName: this.name,
          archivePage: props.archivePage,
          deletePage: props.deletePage,
          getPageDetailsCallback: props.getPageDetailsCallback,
        }),
        new Plugin({
          key: new PluginKey("preventDuplicatePageEmbed"),
          appendTransaction: (transactions, _oldState, newState) => {
            // If none of the transactions changed the document, skip
            if (!transactions.some((tr) => tr.docChanged)) return null;

            // count encountered identifiers and record duplicates with full node size.
            const identifierCount = new Map<string, number>();
            // save duplicate items as { pos, size, identifier }
            const duplicateEntries: { pos: number; size: number; identifier: string }[] = [];

            // traverse the new document
            newState.doc.descendants((node, pos) => {
              // Only check our embed node and when it has an identifier.
              if (node.type.name === ADDITIONAL_EXTENSIONS.PAGE_EMBED_COMPONENT && node.attrs.entity_identifier) {
                const identifier = node.attrs.entity_identifier;
                const currentCount = identifierCount.get(identifier) || 0;
                identifierCount.set(identifier, currentCount + 1);

                // if this identifier is already encountered, mark this node as a duplicate and this means we leave the very first instance intact and flag subsequent ones.
                if (currentCount > 0) {
                  duplicateEntries.push({ pos, size: node.nodeSize, identifier });
                }
              }
            });

            // no duplicates were found
            if (duplicateEntries.length === 0) return null;

            // create a new transaction to remove only the extra duplicates.
            // sort the duplicates descending by pos so that later deletions do not affect earlier positions.
            const tr = newState.tr;
            duplicateEntries
              .sort((a, b) => b.pos - a.pos)
              .forEach(({ pos, size }) => {
                // delete entire node (using pos + nodeSize)
                tr.delete(pos, pos + size);
              });

            // if the transaction makes changes, return it.
            return tr.docChanged ? tr : null;
          },
        }),
        PageEmbedOrderTrackerPlugin({
          onNodesUpdated: props.onNodesPosChanged,
        }),
      ];
    },
  });
