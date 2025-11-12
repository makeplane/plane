import { combineTransactionSteps, findChildrenInRange, getChangedRanges } from "@tiptap/core";
import { Fragment, type Node as ProseMirrorNode, Slice } from "@tiptap/pm/model";
import { Plugin, PluginKey, type Transaction } from "@tiptap/pm/state";
// types
import type { UniqueIDOptions } from "./extension";

const createThrottle = (interval: number) => {
  let lastRun = 0;
  return () => {
    const now = Date.now();
    if (now - lastRun >= interval) {
      lastRun = now;
      return true;
    }
    return false;
  };
};

export const createUniqueIDPlugin = (options: UniqueIDOptions) => {
  let dragSourceElement: Element | null = null;
  let transformPasted = false;
  const shouldRunDuplicateScan = createThrottle(1000);

  return new Plugin({
    key: new PluginKey("uniqueID"),
    appendTransaction: (transactions, oldState, newState) => {
      const hasDocChanges =
        transactions.some((transaction) => transaction.docChanged) && !oldState.doc.eq(newState.doc);
      const filterTransactions =
        options.filterTransaction && transactions.some((tr) => !options.filterTransaction?.(tr));

      const isCollabTransaction = transactions.find((tr) => tr.getMeta("y-sync$"));

      if (isCollabTransaction) {
        return;
      }

      if (!hasDocChanges || filterTransactions) {
        return;
      }

      const { tr } = newState;

      const { types, attributeName, generateID } = options;
      const transform = combineTransactionSteps(oldState.doc, transactions as Transaction[]);

      if (shouldRunDuplicateScan()) {
        const seenIds = new Map<string, number>();
        const duplicatePositions: number[] = [];

        newState.doc.descendants((node, pos) => {
          if (types.includes(node.type.name)) {
            const id = node.attrs[attributeName];

            if (id !== null) {
              if (seenIds.has(id)) {
                duplicatePositions.push(pos);
              } else {
                seenIds.set(id, pos);
              }
            }
          }
        });

        duplicatePositions.forEach((pos) => {
          const node = tr.doc.nodeAt(pos);
          if (node) {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              [attributeName]: generateID({ node, pos }),
            });
          }
        });
      }

      // get changed ranges based on the old state
      const changes = getChangedRanges(transform);

      changes.forEach(({ newRange }) => {
        const newNodes = findChildrenInRange(newState.doc, newRange, (node) => types.includes(node.type.name));

        newNodes.forEach(({ node, pos }) => {
          // Check the current state of the node within `tr.doc`
          // This helps to prevent adding new IDs to the same node
          // if the node changed multiple times within one transaction
          const id = tr.doc.nodeAt(pos)?.attrs[attributeName];

          if (id === null) {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              [attributeName]: generateID({ node, pos }),
            });
            return;
          }
        });
      });

      if (!tr.steps.length) {
        return;
      }

      // `tr.setNodeMarkup` resets the stored marks
      // so we'll restore them if they exist
      tr.setStoredMarks(newState.tr.storedMarks);

      // Don't add ID generation to undo history
      tr.setMeta("addToHistory", false);

      return tr;
    },

    // we register a global drag handler to track the current drag source element
    view(view) {
      const handleDragstart = (event: DragEvent) => {
        dragSourceElement = view.dom.parentElement?.contains(event.target as Element) ? view.dom.parentElement : null;
      };

      window.addEventListener("dragstart", handleDragstart);

      return {
        destroy() {
          window.removeEventListener("dragstart", handleDragstart);
        },
      };
    },

    props: {
      // `handleDOMEvents` is called before `transformPasted`
      // so we can do some checks before
      handleDOMEvents: {
        // only create new ids for dropped content
        // or dropped content while holding `alt`
        // or content is dragged from another editor
        drop: (view, event) => {
          if (dragSourceElement !== view.dom.parentElement || event.dataTransfer?.effectAllowed === "copy") {
            dragSourceElement = null;
            transformPasted = true;
          }

          return false;
        },
        // always create new ids on pasted content
        paste: () => {
          transformPasted = true;

          return false;
        },
      },

      // we'll remove ids for every pasted node
      // so we can create a new one within `appendTransaction`
      transformPasted: (slice) => {
        if (!transformPasted) {
          return slice;
        }

        const { types, attributeName } = options;
        const removeId = (fragment: Fragment): Fragment => {
          const list: ProseMirrorNode[] = [];

          fragment.forEach((node) => {
            // don't touch text nodes
            if (node.isText) {
              list.push(node);

              return;
            }

            // check for any other child nodes
            if (!types.includes(node.type.name)) {
              list.push(node.copy(removeId(node.content)));

              return;
            }

            // remove id
            const nodeWithoutId = node.type.create(
              {
                ...node.attrs,
                [attributeName]: null,
              },
              removeId(node.content),
              node.marks
            );

            list.push(nodeWithoutId);
          });

          return Fragment.from(list);
        };

        // reset check
        transformPasted = false;

        return new Slice(removeId(slice.content), slice.openStart, slice.openEnd);
      },
    },
  });
};
