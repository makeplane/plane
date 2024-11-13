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
  parseInteger,
  // createSplitListCommand,
} from "prosemirror-flat-list";
import { keymap } from "@tiptap/pm/keymap";
import { inputRules } from "@tiptap/pm/inputrules";
import { createSplitListCommand } from "./commands/split-list";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    flatListComponent: {
      createList: (attrs: ListAttributes) => ReturnType;
      indentList: (attrs: IndentListOptions) => ReturnType;
      dedentList: (attrs: DedentListOptions) => ReturnType;
      splitList: () => ReturnType;
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
    return [
      {
        tag: "div",
        getAttrs: (element) => {
          // console.log("asdf", element);
          if (typeof element === "string") {
            return {};
          }
          // console.log("element", element.getAttribute("data-list-kind"));
          return {
            kind: element.getAttribute("data-list-kind") || "bullet",
            order: parseInteger(element.getAttribute("data-list-order")),
            checked: element.hasAttribute("data-list-checked"),
            collapsed: element.hasAttribute("data-list-collapsed"),
          };
        },
      },
    ];
  },
  renderHTML({ node }) {
    // console.log("node", node, node.attrs);
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
        if (editor.isActive(this.name)) {
          // return editor.chain().focus().indentList({ from: $from.pos });
          const indentList = createIndentListCommand({ from: $from.pos });
          return indentList(editor.state, editor.view.dispatch);
        }
        return false;
      },
      "Shift-Tab": ({ editor }) => {
        const { selection } = editor.state;
        const { $from } = selection;
        if (editor.isActive(this.name)) {
          const dedentList = createDedentListCommand({ from: $from.pos });
          return dedentList(editor.state, editor.view.dispatch);
        }
        return false;
      },
      Enter: ({ editor }) => {
        if (editor.isActive(this.name)) {
          const splitList = createSplitListCommand();
          const ans = splitList(editor.state, editor.view.dispatch);
          // __AUTO_GENERATED_PRINT_VAR_START__
          console.log("addKeyboardShortcuts#(anon)#if ans: %s", ans); // __AUTO_GENERATED_PRINT_VAR_END__
          return ans;
        }
        return false;
      },
    };
  },
  addProseMirrorPlugins() {
    return [...createListPlugins({ schema: this.editor.schema }), listKeymapPlugin, listInputRulePlugin];
  },
});
