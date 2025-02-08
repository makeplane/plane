import { Node } from "@tiptap/core";
import { MarkdownSerializerState } from "@tiptap/pm/markdown";
import { Node as NodeType } from "@tiptap/pm/model";

const BulletList = Node.create({
  name: "bulletList",
});

export default BulletList.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: NodeType) {
          return state.renderList(
            node,
            "  ",
            () => (this.editor.storage.markdown.options.bulletListMarker || "-") + " "
          );
        },
        parse: {
          // handled by markdown-it
        },
      },
    };
  },
});
