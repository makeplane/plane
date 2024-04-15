import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { KeyboardShortcutCommand } from "@tiptap/core";

export const insertLineAboveImageAction: KeyboardShortcutCommand = ({ editor }) => {
  const { selection, doc } = editor.state;
  const { $from, $to } = selection;

  let imageNode: ProseMirrorNode | null = null;
  let imagePos: number | null = null;

  // Check if the selection itself is an image node
  doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
    if (node.type.name === "image") {
      imageNode = node;
      imagePos = pos;
      return false; // Stop iterating once an image node is found
    }
    return true;
  });

  if (imageNode === null || imagePos === null) return false;

  // Since we want to insert above the image, we use the imagePos directly
  const insertPos = imagePos;

  if (insertPos < 0) return false;

  // Check for an existing node immediately before the image
  if (insertPos === 0) {
    // If the previous node doesn't exist or isn't a paragraph, create and insert a new empty node there
    editor.chain().insertContentAt(insertPos, { type: "paragraph" }).run();
    editor.chain().setTextSelection(insertPos).run();
  } else {
    const prevNode = doc.nodeAt(insertPos);

    if (prevNode && prevNode.type.name === "paragraph") {
      // If the previous node is a paragraph, move the cursor there
      editor.chain().setTextSelection(insertPos).run();
    } else {
      return false;
    }
  }

  return true;
};
