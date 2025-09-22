import { isChangeOrigin } from "@tiptap/extension-collaboration";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { type EditorState, Plugin, PluginKey, type Transaction } from "@tiptap/pm/state";
// plane imports
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";

export type TPageNodesInfo = {
  id: string;
  index: number;
};

type TPageEmbedOrderTrackerPluginOptions = {
  onNodesUpdated?: (nodes: TPageNodesInfo[]) => void;
};

const PageEmbedOrderTrackerPluginKey = new PluginKey("pageEmbedOrderTracker");

export const PageEmbedOrderTrackerPlugin = (options: TPageEmbedOrderTrackerPluginOptions) =>
  new Plugin({
    key: PageEmbedOrderTrackerPluginKey,
    appendTransaction(
      transactions: readonly Transaction[],
      oldState: EditorState,
      newState: EditorState
    ): Transaction | null {
      const hasChanges = transactions.some((tr) => tr.docChanged);
      // Only process if there were actual changes
      const isAnyTransactionFromOtherClient = transactions.some((tr) => isChangeOrigin(tr));
      if (!hasChanges || isAnyTransactionFromOtherClient) return null;

      // Get pageEmbedComponent nodes from old and new states
      const oldNodes = getPageEmbedNodes(oldState.doc);
      const newNodes = getPageEmbedNodes(newState.doc);

      // Check if any nodes have moved or if the order has changed
      const hasMovedNodes = detectMovedNodes(oldNodes, newNodes);

      if (hasMovedNodes) {
        options.onNodesUpdated?.(newNodes);
      }

      return null;
    },
  });

function getPageEmbedNodes(doc: ProseMirrorNode): TPageNodesInfo[] {
  const nodes: TPageNodesInfo[] = [];

  doc.descendants((node, _pos, _parent, index) => {
    if (node.type.name === ADDITIONAL_EXTENSIONS.PAGE_EMBED_COMPONENT) {
      nodes.push({
        id: node.attrs?.entity_identifier,
        index,
      });
    }
  });

  return nodes;
}

function detectMovedNodes(oldNodes: TPageNodesInfo[], newNodes: TPageNodesInfo[]): boolean {
  // If the number of nodes changed, consider it as moved/updated
  if (oldNodes.length !== newNodes.length) {
    return true;
  }

  // Create maps for efficient lookup
  const oldNodeMap = new Map<string, TPageNodesInfo>();
  const newNodeMap = new Map<string, TPageNodesInfo>();

  // Build maps
  oldNodes.forEach((nodeData) => {
    oldNodeMap.set(nodeData.id, nodeData);
  });

  newNodes.forEach((nodeData) => {
    newNodeMap.set(nodeData.id, nodeData);
  });

  // Check if any nodes have moved
  for (const newNodeData of newNodes) {
    const oldNodeData = oldNodeMap.get(newNodeData.id);

    if (oldNodeData) {
      // Check if the node moved (different index or position)
      const indexChanged = oldNodeData.index !== newNodeData.index;

      if (indexChanged) {
        return true; // Found at least one moved node
      }
    } else {
      // New node was added
      return true;
    }
  }

  // Check for deleted nodes
  for (const oldNodeData of oldNodes) {
    if (!newNodeMap.has(oldNodeData.id)) {
      return true; // Node was deleted
    }
  }

  return false; // No changes detected
}
