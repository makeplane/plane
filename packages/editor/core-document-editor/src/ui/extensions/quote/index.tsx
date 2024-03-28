import Blockquote from "@tiptap/extension-blockquote";

export const CustomQuoteExtension = Blockquote.extend({
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { $from, $to, $head } = this.editor.state.selection;
        const parent = $head.node(-1);

        if (!parent) return false;

        if (parent.type.name !== "blockquote") {
          return false;
        }
        if ($from.pos !== $to.pos) return false;
        // if ($head.parentOffset < $head.parent.content.size) return false;

        // this.editor.commands.insertContentAt(parent.ne);
        this.editor.chain().splitBlock().lift(this.name).run();

        return true;
      },
    };
  },
});
