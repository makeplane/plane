import { TableCell } from "@tiptap/extension-table-cell";

export const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      isHeader: {
        default: false,
        parseHTML: (element) => {
          isHeader: element.tagName === "TD";
        },
        renderHTML: (attributes) => {
          tag: attributes.isHeader ? "th" : "td";
        },
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    if (HTMLAttributes.isHeader) {
      return [
        "th",
        {
          ...HTMLAttributes,
          class: `relative ${HTMLAttributes.class}`,
        },
        ["span", { class: "absolute top-0 right-0" }],
        0,
      ];
    }
    return ["td", HTMLAttributes, 0];
  },
});
