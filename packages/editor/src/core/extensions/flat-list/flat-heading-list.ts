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
  enterWithoutLift,
} from "prosemirror-flat-list";
import { keymap } from "@tiptap/pm/keymap";
import { inputRules } from "@tiptap/pm/inputrules";
import { createSplitListCommand } from "./commands/split-list";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    flatHeadingListComponent: {
      createList: (attrs: ListAttributes) => ReturnType;
      indentList: (attrs: IndentListOptions) => ReturnType;
      dedentList: (attrs: DedentListOptions) => ReturnType;
      splitList: () => ReturnType;
      createHeadedList: (attrs: ListAttributes & { title: string }) => ReturnType;
    };
  }
}

const { attrs, parseDOM, toDOM, group, definingForContent, definingAsContext } = createListSpec();
const listKeymapPlugin = keymap(listKeymap);
const listInputRulePlugin = inputRules({ rules: listInputRules });

export const FlatHeadingListExtension = Node.create({
  name: "headingList",
  content: "heading block*",
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
      splitList:
        () =>
        ({ state, view }) => {
          const splitList = createSplitListCommand();
          return splitList(state, view.dispatch);
        },
      createHeadedList:
        (attrs: ListAttributes & { title: string }) =>
        ({ state, chain, commands }) => {
          try {
            chain()
              .focus()
              .setHeading({ level: 1 })
              .setTextSelection(state.selection.from - 1)
              .run();

            return commands.createList({
              kind: attrs.kind || "bullet",
              order: attrs.order,
              checked: attrs.checked,
              collapsed: attrs.collapsed,
            });
          } catch (error) {
            console.error("Error in creating heading list", error);
            return false;
          }
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
      Enter: ({ editor }) => {
        if (editor.isActive(this.name)) {
          console.log("called");
          editor.chain().focus().splitList();
          return true;
        }
        return false;
      },
      "Shift-Enter": ({ editor }) => {
        if (editor.isActive(this.name)) {
          return enterWithoutLift(editor.state, editor.view.dispatch);
        }
        return false;
      },
      "Mod-Shift-7": ({ editor }) => {
        try {
          console.log("asfd");
          return editor.commands.createHeadedList({ title: "a", kind: "bullet" });
        } catch (error) {
          console.error("Error in creating heading list", error);
          return false;
        }
      },
      "Mod-Shift-8": ({ editor }) => {
        try {
          console.log("asfd");
          return editor.commands.createHeadedList({ title: "a", kind: "ordered" });
        } catch (error) {
          console.error("Error in creating heading list", error);
          return false;
        }
      },
    };
  },
  addProseMirrorPlugins() {
    return [...createListPlugins({ schema: this.editor.schema }), listKeymapPlugin, listInputRulePlugin];
  },
});
