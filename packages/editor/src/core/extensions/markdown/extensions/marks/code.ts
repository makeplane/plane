import { Mark } from "@tiptap/core";
import { defaultMarkdownSerializer } from "@tiptap/pm/markdown";

const Code = Mark.create({
  name: "code",
});

export default Code.extend({
  addStorage() {
    return {
      markdown: {
        serialize: defaultMarkdownSerializer.marks.code,
        parse: {
          // handled by markdown-it
        },
      },
    };
  },
});
