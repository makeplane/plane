import { isChangeOrigin } from "@tiptap/extension-collaboration";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { TPage } from "@plane/types";

const pluginKey = new PluginKey("prevent-page-embed-deletion");

export const PreventPageEmbedDeletionPlugin = ({
  getPageDetailsCallback,
  nodeTypeName,
  deletePage,
  archivePage,
}: {
  getPageDetailsCallback?: (pageId: string) => TPage;
  nodeTypeName?: string;
  archivePage?: (id: string) => Promise<void>;
  deletePage?: (id: string[]) => Promise<void>;
}) =>
  new Plugin({
    key: pluginKey,
    filterTransaction(transaction, state) {
      // Allow sync and intentional deletion transactions
      const isEventFromOtherClient = isChangeOrigin(transaction);
      if (isEventFromOtherClient) {
        return true;
      }
      if (transaction.getMeta("intentionalDeletion")) {
        return true;
      }

      // Avoid infinite recursion via our own metadata flag
      if (transaction.getMeta("preventPageEmbedDeletionFiltering") === true) {
        return true;
      }

      // Skip if no document change
      if (!transaction.docChanged) {
        return true;
      }

      // Set metadata flag to prevent recursion
      transaction.setMeta("preventPageEmbedDeletionFiltering", true);

      // Simulate the transaction to see its effects
      const newState = state.apply(transaction);

      // Find all nodes of our type (with IDs) in both states.
      const oldNodes = findNodesWithIds(state.doc, nodeTypeName);
      const newNodes = findNodesWithIds(newState.doc, nodeTypeName);

      // Collect *all* nodes that were deleted
      const removedNodes = oldNodes.filter((oldNode) => !newNodes.some((newNode) => newNode.id === oldNode.id));
      const deletedPages: string[] = [];

      // If any nodes were deleted, process each one
      if (removedNodes.length > 0) {
        removedNodes.forEach((oldNode) => {
          const page = getPageDetailsCallback?.(oldNode.id);
          if (page?.archived_at) {
            deletedPages.push(oldNode.id);
          } else {
            archivePage?.(oldNode.id).catch((error) => console.error("Error archiving page:", error));
          }
        });

        if (deletedPages.length > 0) {
          deletePage?.(deletedPages);
        }

        // Prevent the transaction from applying
        return false;
      }

      // Otherwise, allow the transaction
      return true;
    },
  });

// Helper function to find all nodes of a given type that have an entity_identifier.
function findNodesWithIds(doc: any, nodeTypeName?: string) {
  const result: Array<{ id: string; node: any }> = [];

  doc.descendants((node, pos) => {
    if (node.type.name === nodeTypeName && node.attrs.entity_identifier) {
      result.push({
        id: node.attrs.entity_identifier,
        node,
      });
    }
    return true;
  });

  return result;
}
