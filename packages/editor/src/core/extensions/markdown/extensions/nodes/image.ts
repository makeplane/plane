import { Node } from "@tiptap/core";
import { defaultMarkdownSerializer } from "@tiptap/pm/markdown";

const Image = Node.create({
  name: "image",
});

export default Image.extend({
  addStorage() {
    return {
      markdown: {
        serialize: defaultMarkdownSerializer.nodes.image,
        parse: {
          // handled by markdown-it
        },
      },
    };
  },
});
