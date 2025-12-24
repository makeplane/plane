import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

type NodeHighlightState = {
  highlightedNodeId: string | null;
  decorations: DecorationSet;
};

type NodeHighlightMeta = {
  nodeId?: string | null;
};

export const nodeHighlightPluginKey = new PluginKey<NodeHighlightState>("nodeHighlight");

const buildDecorations = (doc: Parameters<typeof DecorationSet.create>[0], highlightedNodeId: string | null) => {
  if (!highlightedNodeId) {
    return DecorationSet.empty;
  }

  const decorations: Decoration[] = [];
  const highlightClassNames = ["bg-accent-primary/20", "transition-all", "duration-300", "rounded"];

  doc.descendants((node, pos) => {
    // Check if this node has the id we're looking for
    if (node.attrs && node.attrs.id === highlightedNodeId) {
      const decorationAttrs: Record<string, string> = {
        "data-node-highlighted": "true",
        class: highlightClassNames.join(" "),
      };

      // For text nodes, highlight the inline content
      if (node.isText) {
        decorations.push(
          Decoration.inline(pos, pos + node.nodeSize, decorationAttrs, {
            inclusiveStart: true,
            inclusiveEnd: true,
          })
        );
      } else {
        // For block nodes, add a node decoration
        decorations.push(Decoration.node(pos, pos + node.nodeSize, decorationAttrs));
      }

      return false; // Stop searching once we found the node
    }

    return true;
  });

  return DecorationSet.create(doc, decorations);
};

export const NodeHighlightPlugin = () =>
  new Plugin<NodeHighlightState>({
    key: nodeHighlightPluginKey,
    state: {
      init: () => ({
        highlightedNodeId: null,
        decorations: DecorationSet.empty,
      }),
      apply: (tr, value, _oldState, newState) => {
        let highlightedNodeId = value.highlightedNodeId;
        let decorations = value.decorations;

        const meta = tr.getMeta(nodeHighlightPluginKey) as NodeHighlightMeta | undefined;
        let shouldRecalculate = tr.docChanged;

        if (meta) {
          if (meta.nodeId !== undefined) {
            highlightedNodeId = typeof meta.nodeId === "string" && meta.nodeId.length > 0 ? meta.nodeId : null;
            shouldRecalculate = true;
          }
        }

        if (shouldRecalculate) {
          decorations = buildDecorations(newState.doc, highlightedNodeId);
        } else if (tr.docChanged) {
          decorations = decorations.map(tr.mapping, newState.doc);
        }

        return {
          highlightedNodeId,
          decorations,
        };
      },
    },
    props: {
      decorations(state) {
        return nodeHighlightPluginKey.getState(state)?.decorations ?? DecorationSet.empty;
      },
    },
  });
