import { Mark } from "@tiptap/core";
import { defaultMarkdownSerializer } from "prosemirror-markdown";


const Link = Mark.create({
    name: 'link',
});

export default Link.extend({
    /**
     * @return {{markdown: MarkdownMarkSpec}}
     */
    addStorage() {
        return {
            markdown: {
                serialize: defaultMarkdownSerializer.marks.link,
                parse: {
                    // handled by markdown-it
                }
            }
        }
    }
})
