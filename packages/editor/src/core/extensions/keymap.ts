import { Extension } from "@tiptap/core";
import type { NodeType } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { canJoin } from "@tiptap/pm/transform";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customKeymap: {
      /**
       * Select text between node boundaries
       */
      selectTextWithinNodeBoundaries: () => ReturnType;
    };
  }
}

function autoJoin(tr: Transaction, newTr: Transaction, nodeTypes: NodeType[]) {
  // Find all ranges where we might want to join.
  const ranges: Array<number> = [];
  for (let i = 0; i < tr.mapping.maps.length; i++) {
    const map = tr.mapping.maps[i];
    for (let j = 0; j < ranges.length; j++) ranges[j] = map.map(ranges[j]);
    map.forEach((_s, _e, from, to) => ranges.push(from, to));
  }

  // Figure out which joinable points exist inside those ranges,
  // by checking all node boundaries in their parent nodes.
  const joinable: number[] = [];
  for (let i = 0; i < ranges.length; i += 2) {
    const from = ranges[i],
      to = ranges[i + 1];
    const $from = tr.doc.resolve(from),
      depth = $from.sharedDepth(to),
      parent = $from.node(depth);
    for (let index = $from.indexAfter(depth), pos = $from.after(depth + 1); pos <= to; ++index) {
      const after = parent.maybeChild(index);
      if (!after) break;
      if (index && joinable.indexOf(pos) == -1) {
        const before = parent.child(index - 1);
        if (before.type == after.type && nodeTypes.includes(before.type)) joinable.push(pos);
      }
      pos += after.nodeSize;
    }
  }

  let joined = false;

  // Join the joinable points
  joinable.sort((a, b) => a - b);
  for (let i = joinable.length - 1; i >= 0; i--) {
    if (canJoin(tr.doc, joinable[i])) {
      newTr.join(joinable[i]);
      joined = true;
    }
  }

  return joined;
}

export const CustomKeymap = Extension.create({
  name: "customKeymap",

  addCommands() {
    return {
      selectTextWithinNodeBoundaries:
        () =>
        ({ editor, commands }) => {
          const { state } = editor;
          const { tr } = state;
          const startNodePos = tr.selection.$from.start();
          const endNodePos = tr.selection.$to.end();
          return commands.setTextSelection({
            from: startNodePos,
            to: endNodePos,
          });
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("ordered-list-merging"),
        appendTransaction(transactions, oldState, newState) {
          // Create a new transaction.
          const newTr = newState.tr;

          const joinableNodes = [
            newState.schema.nodes[CORE_EXTENSIONS.ORDERED_LIST],
            newState.schema.nodes[CORE_EXTENSIONS.TASK_LIST],
            newState.schema.nodes[CORE_EXTENSIONS.BULLET_LIST],
          ];

          let joined = false;
          for (const transaction of transactions) {
            const anotherJoin = autoJoin(transaction, newTr, joinableNodes);
            joined = anotherJoin || joined;
          }
          if (joined) {
            return newTr;
          }
        },
      }),
    ];
  },
  addKeyboardShortcuts() {
    return {
      "Mod-a": ({ editor }) => {
        const { state } = editor;
        const { tr } = state;
        const startSelectionPos = tr.selection.from;
        const endSelectionPos = tr.selection.to;
        const startNodePos = tr.selection.$from.start();
        const endNodePos = tr.selection.$to.end();
        const isCurrentTextSelectionNotExtendedToNodeBoundaries =
          startSelectionPos > startNodePos || endSelectionPos < endNodePos;

        if (isCurrentTextSelectionNotExtendedToNodeBoundaries) {
          // First press: select text within node boundaries
          editor.chain().selectTextWithinNodeBoundaries().run();
          return true;
        } else {
          editor.commands.selectAll();
          return true;
        }
      },
    };
  },
});
