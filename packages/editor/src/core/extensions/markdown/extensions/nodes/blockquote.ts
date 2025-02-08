import { Node } from "@tiptap/core";
import { defaultMarkdownSerializer } from "@tiptap/pm/markdown";

const Blockquote = Node.create({
  name: "blockquote",
});

export default Blockquote.extend({
  addStorage() {
    return {
      markdown: {
        serialize: defaultMarkdownSerializer.nodes.blockquote,
        parse: {
          // handled by markdown-it
        },
      },
    };
  },
});
