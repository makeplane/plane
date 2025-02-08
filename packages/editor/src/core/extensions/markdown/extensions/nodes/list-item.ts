import { Node } from "@tiptap/core";
import { defaultMarkdownSerializer } from "@tiptap/pm/markdown";

const ListItem = Node.create({
  name: "listItem",
});

export default ListItem.extend({
  addStorage() {
    return {
      markdown: {
        serialize: defaultMarkdownSerializer.nodes.list_item,
        parse: {
          // handled by markdown-it
        },
      },
    };
  },
});
