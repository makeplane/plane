import { Node } from "@tiptap/core";
import {
  createListSpec,
  createListPlugins,
  listKeymap,
  listInputRules,
  ListAttributes,
  createWrapInListCommand,
} from "prosemirror-flat-list";
import { keymap } from "@tiptap/pm/keymap";
import { inputRules } from "@tiptap/pm/inputrules";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    flatListComponent: {
      createList: (attrs: ListAttributes) => ReturnType;
    };
  }
}

const { attrs, parseDOM, toDOM, content, group, definingForContent, definingAsContext } = createListSpec();
const listKeymapPlugin = keymap(listKeymap);
const listInputRulePlugin = inputRules({ rules: listInputRules });

export const FlatListExtension = Node.create({
  name: "flatListComponent",
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
        ({ editor }) => {
          console.log("createList", attrs);
          const wrapInList = createWrapInListCommand<ListAttributes>(attrs);
          return wrapInList(editor.state, editor.view.dispatch);
        },
    };
  },
  addProseMirrorPlugins() {
    return [...createListPlugins({ schema: this.editor.schema }), listKeymapPlugin, listInputRulePlugin];
  },
});
