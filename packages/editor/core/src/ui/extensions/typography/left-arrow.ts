import { Mark, markInputRule } from "@tiptap/core";

export const LeftArrow = Mark.create({
  name: "leftArrow",
  group: "inline",
  inline: true,
  draggable: false,
  atom: true,

  addInputRules() {
    return [
      markInputRule({
        find: /->$/,
        type: this.type,
      }),
    ];
  },

  parseHTML() {
    return [
      {
        tag: "span[style]",
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      {
        ...HTMLAttributes,
        style: 'font-family: "system-ui", sans-serif;',
      },
      "→",
    ];
  },
});
