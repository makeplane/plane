import { Node } from "@tiptap/core";
import { inputRules } from "@tiptap/pm/inputrules";
import { keymap } from "@tiptap/pm/keymap";
import { ResolvedPos } from "@tiptap/pm/model";
import {
  ListAttributes,
  IndentListOptions,
  DedentListOptions,
  createListSpec,
  listKeymap,
  listInputRules,
  createWrapInListCommand,
  createIndentListCommand,
  createDedentListCommand,
  createSplitListCommand,
  createListPlugins,
} from "./core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    flatListComponent: {
      createList: (attrs: ListAttributes) => ReturnType;
      indentList: (attrs: IndentListOptions) => ReturnType;
      dedentList: (attrs: DedentListOptions) => ReturnType;
      splitList: () => ReturnType;
    };
  }
}

const { attrs, parseDOM, toDOM, content, group } = createListSpec();

const listKeymapPlugin = keymap(listKeymap);
const listInputRulePlugin = inputRules({ rules: listInputRules });

export const FlatListExtension = Node.create({
  name: "list",
  content,
  group,
  defining: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return attrs || {};
  },
  parseHTML() {
    return parseDOM;
  },
  renderHTML({ node }) {
    return toDOM?.(node) || ["div", 0];
  },
  addCommands() {
    return {
      createList:
        (attrs: ListAttributes) =>
        ({ state, view }) => {
          const wrapInList = createWrapInListCommand<ListAttributes>(attrs);
          return wrapInList(state, view.dispatch);
        },
      indentList:
        (attrs: IndentListOptions) =>
        ({ state, view }) => {
          const indentList = createIndentListCommand(attrs);
          return indentList(state, view.dispatch);
        },
      dedentList:
        (attrs: DedentListOptions) =>
        ({ state, view }) => {
          const dedentList = createDedentListCommand(attrs);
          return dedentList(state, view.dispatch);
        },
      splitList:
        () =>
        ({ state, view }) => {
          const splitList = createSplitListCommand();
          return splitList(state, view.dispatch);
        },
    };
  },

  addKeyboardShortcuts(this) {
    return {
      Tab: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;

        const isBetweenListNodes = isBetweenLists($from);

        if (editor.isActive(this.name) || isBetweenListNodes) {
          const indentList = createIndentListCommand({ from: $from.pos });
          return indentList(editor.state, editor.view.dispatch);
        }
        return false;
      },
      "Shift-Tab": ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;
        if (editor.isActive(this.name)) {
          console.log("shift tab");
          const dedentList = createDedentListCommand({ from: $from.pos });
          return dedentList(editor.state, editor.view.dispatch);
        }
        return false;
      },
      Enter: ({ editor }) => {
        if (editor.isActive(this.name)) {
          const splitList = createSplitListCommand();
          const ans = splitList(editor.state, editor.view.dispatch);
          return ans;
        }
        return false;
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      ...createListPlugins({
        schema: this.editor.schema,
      }),
      listKeymapPlugin,
      listInputRulePlugin,
    ];
  },
});

function isBetweenLists($pos: ResolvedPos): boolean {
  let foundBefore = false;
  let foundAfter = false;

  // Single loop to check both directions
  for (let depth = $pos.depth; depth >= 0; depth--) {
    const node = $pos.node(depth);
    const index = $pos.index(depth);

    // Check previous sibling if not found yet
    if (!foundBefore && index > 0) {
      foundBefore = node.child(index - 1).type.name === "list";
    }

    // Check next sibling if not found yet
    if (!foundAfter && index < node.childCount - 1) {
      foundAfter = node.child(index + 1).type.name === "list";
    }

    // Early exit if both conditions are met
    if (foundBefore && foundAfter) {
      return true;
    }
  }

  return false;
}
