import { Mark } from "@tiptap/core";
import { defaultMarkdownSerializer } from "@tiptap/pm/markdown";

const Link = Mark.create({
  name: "link",
});

export default Link.extend({
  addStorage() {
    return {
      markdown: {
        serialize: defaultMarkdownSerializer.marks.link,
        parse: {
          // handled by markdown-it
        },
      },
    };
  },
});
