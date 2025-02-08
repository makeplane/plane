import { Node } from "@tiptap/core";
import { defaultMarkdownSerializer } from "@tiptap/pm/markdown";

const HorizontalRule = Node.create({
  name: "horizontalRule",
});

export default HorizontalRule.extend({
  addStorage() {
    return {
      markdown: {
        serialize: defaultMarkdownSerializer.nodes.horizontal_rule,
        parse: {
          // handled by markdown-it
        },
      },
    };
  },
});
