import { Mark } from "@tiptap/core";
import { defaultMarkdownSerializer } from "prosemirror-markdown";


const Code = Mark.create({
    name: 'code',
});

export default Code.extend({
    /**
     * @return {{markdown: MarkdownMarkSpec}}
     */
    addStorage() {
        return {
            markdown: {
                serialize: defaultMarkdownSerializer.marks.code,
                parse: {
                    // handled by markdown-it
                }
            }
        }
    }
})
