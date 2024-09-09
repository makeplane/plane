import { Node } from "@tiptap/pm/model";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const findAllColors = (doc: Node): DecorationSet => {
  const hexColor = /(#[0-9a-f]{3,6})\b/gi;
  const decorations: Decoration[] = [];

  doc.descendants((node, position) => {
    if (!node.text) {
      return;
    }

    Array.from(node.text.matchAll(hexColor)).forEach((match) => {
      const color = match[0];
      const index = match.index || 0;
      const from = position + index;
      const to = from + color.length;
      const decoration = Decoration.inline(from, to, {
        class: "editor-color-swatch",
        style: `--color: ${color}`,
      });
      decorations.push(decoration);
    });
  });

  return DecorationSet.create(doc, decorations);
};
