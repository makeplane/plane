import { Mark } from "@tiptap/core";
import { defaultMarkdownSerializer } from "prosemirror-markdown";


const Italic = Mark.create({
    name: 'italic',
});

export default Italic.extend({
    /**
     * @return {{markdown: MarkdownMarkSpec}}
     */
    addStorage() {
        return {
            markdown: {
                serialize: defaultMarkdownSerializer.marks.em,
                parse: {
                    // handled by markdown-it
                }
            }
        }
    }
})
