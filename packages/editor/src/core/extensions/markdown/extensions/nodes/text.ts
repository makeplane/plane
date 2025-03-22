import { Node } from "@tiptap/core";
import { MarkdownSerializerState } from "@tiptap/pm/markdown";
import { Node as NodeType } from "@tiptap/pm/model";
import { escapeHTML } from "../../util/dom";

const Text = Node.create({
  name: "text",
});

export default Text.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: NodeType, parent: NodeType, index: number) {
          state.text(escapeHTML(node.text));
        },
        parse: {
          // handled by markdown-it
        },
      },
    };
  },
});
