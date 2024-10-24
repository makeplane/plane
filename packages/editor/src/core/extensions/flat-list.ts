import { Node } from "@tiptap/core";
import {
  createListSpec,
  createListPlugins,
  listKeymap,
  listInputRules,
  ListAttributes,
  createWrapInListCommand,
  DedentListOptions,
  IndentListOptions,
  createIndentListCommand,
  createDedentListCommand,
} from "prosemirror-flat-list";
import { keymap } from "@tiptap/pm/keymap";
import { inputRules } from "@tiptap/pm/inputrules";
import migrationPlugin from "./old-list-migration";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    flatListComponent: {
      createList: (attrs: ListAttributes) => ReturnType;
      indentList: (attrs: IndentListOptions) => ReturnType;
      dedentList: (attrs: DedentListOptions) => ReturnType;
      // unwrapList: (attrs: UnwrapListOptions) => ReturnType;
    };
  }
}

const { attrs, parseDOM, toDOM, content, group, definingForContent, definingAsContext } = createListSpec();
const listKeymapPlugin = keymap(listKeymap);
const listInputRulePlugin = inputRules({ rules: listInputRules });

export const FlatListExtension = Node.create({
  name: "list",
  content,
  group,
  definingForContent,
  definingAsContext,
  addAttributes() {
    return attrs;
  },
  parseHTML() {
    return parseDOM;
  },
  renderHTML({ node }) {
    return toDOM(node);
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
    };
  },
  addKeyboardShortcuts(this) {
    return {
      Tab: ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;
        if (editor.isActive(this.name)) {
          editor.chain().focus().indentList({ from: $from.pos });
          return true;
        }
        return false;
      },
      "Shift-Tab": ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;
        if (editor.isActive(this.name)) {
          editor.chain().focus().dedentList({ from: $from.pos });
          return true;
        }
        return false;
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      ...createListPlugins({ schema: this.editor.schema }),
      listKeymapPlugin,
      listInputRulePlugin,
      // migrationPlugin,
    ];
  },
});
