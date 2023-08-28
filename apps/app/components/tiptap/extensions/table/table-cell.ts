import { TableCell } from "@tiptap/extension-table-cell";
import { Star } from "lucide-react";

export const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      isHeader: {
        default: false,
        parseHTML: (element) => {
          console.log("ran inside", element.tagName);
          return { isHeader: element.tagName === "TD" };
        },
        renderHTML: (attributes) => {
          return { tag: attributes.isHeader ? "th" : "td" };
        },
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    console.log("ran", HTMLAttributes);
    if (HTMLAttributes.isHeader) {
      return [
        "th",
        {
          ...HTMLAttributes,
          class: `relative ${HTMLAttributes.class}`,
        },
        [
          "span",
          { class: "absolute top-0 right-0" },
          Star
        ],
        0,
      ];
    }
    return ["td", HTMLAttributes, 0];
  },
});
