import { Node } from "@tiptap/core";
import { createListSpec, createListPlugins, listKeymap, listInputRules } from "prosemirror-flat-list";
import { keymap } from "@tiptap/pm/keymap";
import { inputRules } from "@tiptap/pm/inputrules";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    flatListComponent: {
      toggleCustomList: (attrs: Record<string, any>) => ReturnType;
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
  addProseMirrorPlugins() {
    return [...createListPlugins({ schema: this.editor.schema }), listKeymapPlugin, listInputRulePlugin];
  },
});
