import { Node } from "@tiptap/core";
import { MarkdownSerializerState } from "@tiptap/pm/markdown";
import { Node as NodeType } from "@tiptap/pm/model";
import HTMLNode from "./html";

const HardBreak = Node.create({
  name: "hardBreak",
});

export default HardBreak.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: NodeType, parent: NodeType, index: number) {
          for (let i = index + 1; i < parent.childCount; i++)
            if (parent.child(i).type != node.type) {
              state.write(state.inTable ? HTMLNode.storage.markdown.serialize.call(this, state, node, parent) : "\\\n");
              return;
            }
        },
        parse: {
          // handled by markdown-it
        },
      },
    };
  },
});
