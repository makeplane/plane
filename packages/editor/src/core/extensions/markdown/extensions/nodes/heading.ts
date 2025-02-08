import { Node } from "@tiptap/core";
import { defaultMarkdownSerializer } from "@tiptap/pm/markdown";

const Heading = Node.create({
  name: "heading",
});

export default Heading.extend({
  addStorage() {
    return {
      markdown: {
        serialize: defaultMarkdownSerializer.nodes.heading,
        parse: {
          // handled by markdown-it
        },
      },
    };
  },
});
