import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { KeyboardShortcutCommand } from "@tiptap/core";

export const insertLineBelowImageAction: KeyboardShortcutCommand = ({ editor }) => {
  try {
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

    const guaranteedImageNode: ProseMirrorNode = imageNode;
    const nextNodePos = imagePos + guaranteedImageNode.nodeSize;

    // Check for an existing node immediately after the image
    const nextNode = doc.nodeAt(nextNodePos);

    if (nextNode && nextNode.type.name === "paragraph") {
      // If the next node is a paragraph, move the cursor there
      const endOfParagraphPos = nextNodePos + nextNode.nodeSize - 1;
      editor.chain().setTextSelection(endOfParagraphPos).run();
    } else if (!nextNode) {
      // If the next node doesn't exist i.e. we're at the end of the document, create and insert a new empty node there
      editor.chain().insertContentAt(nextNodePos, { type: "paragraph" }).run();
      editor
        .chain()
        .setTextSelection(nextNodePos + 1)
        .run();
    } else {
      // If the next node is not a paragraph, do not proceed
      return false;
    }

    return true;
  } catch (error) {
    console.error("An error occurred while inserting a line below the image:", error);
    return false;
  }
};
