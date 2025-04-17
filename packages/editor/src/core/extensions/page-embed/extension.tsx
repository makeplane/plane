import { Plugin, PluginKey } from "@tiptap/pm/state";
import { ReactNodeViewRenderer, NodeViewWrapper, Editor } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
// types
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
import { TPageEmbedConfig } from "@/types";
// extension config
import { PageEmbedExtensionAttributes, PageEmbedExtensionConfig } from "./extension-config";
import { PreventPageEmbedDeletionPlugin } from "./plugins/prevent-deletion-page-embed";

type Props = {
  widgetCallback: TPageEmbedConfig["widgetCallback"];
  archivePage?: TPageEmbedConfig["archivePage"];
  unarchivePage?: TPageEmbedConfig["unarchivePage"];
  deletePage?: TPageEmbedConfig["deletePage"];
  getPageDetailsCallback?: TPageEmbedConfig["getPageDetailsCallback"];
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
      return {
        insertPageEmbed:
          ({ pageId, workspaceSlug, position }) =>
          ({ commands, chain, editor, dispatch }) => {
            const transactionId = uuidv4();
            let success = false;

            if (position) {
              // Insert at specific position
              success = commands.insertContentAt(position, {
                type: this.name,
                attrs: {
                  id: transactionId,
                  entity_identifier: pageId,
                  workspace_identifier: workspaceSlug,
                  entity_name: "sub_page",
                } as PageEmbedExtensionAttributes,
              });

              if (success && dispatch && editor) {
                // Find the inserted node to determine its end position
                const nodeEndPos = position + (editor.state?.doc.nodeAt(position)?.nodeSize || 0);

                // Check if there's already a paragraph after this node
                const nodeAfter = editor.state.doc.nodeAt(nodeEndPos);

                if (!nodeAfter || nodeAfter.type.name !== "paragraph") {
                  // No paragraph after, create one
                  chain()
                    .insertContentAt(nodeEndPos, { type: "paragraph" })
                    .setTextSelection(nodeEndPos + 1)
                    .run();
                } else {
                  // Paragraph exists, just move cursor there
                  chain()
                    .setTextSelection(nodeEndPos + 1)
                    .run();
                }
              }
            } else {
              // Insert at current position
              success = commands.insertContent({
                type: this.name,
                attrs: {
                  id: transactionId,
                  entity_identifier: pageId,
                  workspace_identifier: workspaceSlug,
                  entity_name: "sub_page",
                } as PageEmbedExtensionAttributes,
              });

              if (success && dispatch) {
                // After insertion, create a paragraph or focus on existing one
                chain().createParagraphNear().focus().run();
              }
            }

            return success;
          },
      };
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
              if (node.type.name === "pageEmbedComponent" && node.attrs.entity_identifier) {
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
      ];
    },
  });
