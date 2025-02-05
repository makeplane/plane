import { Mark } from "@tiptap/core";


const Strike = Mark.create({
    name: 'strike',
});

export default Strike.extend({
    /**
     * @return {{markdown: MarkdownMarkSpec}}
     */
    addStorage() {
        return {
            markdown: {
                serialize: {open: '~~', close: '~~', expelEnclosingWhitespace: true},
                parse: {
                    // handled by markdown-it
                },
            },
        }
    }
});
