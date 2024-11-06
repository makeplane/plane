import { KeyboardShortcutCommand } from "@tiptap/core";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";

type Direction = "up" | "down";

export const insertEmptyParagraphAtNodeBoundaries: (
  direction: Direction,
  nodeType: string
) => KeyboardShortcutCommand =
  (direction, nodeType) =>
  ({ editor }) => {
    try {
      const { selection, doc } = editor.state;
      const { $from, $to } = selection;

      let targetNode: ProseMirrorNode | null = null;
      let targetNodePos: number | null = null;

      // Check if the selection itself is the target node
      doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
        if (node.type.name === nodeType) {
          targetNode = node;
          targetNodePos = pos;
          return false; // Stop iterating once the target node is found
        }
        return true;
      });

      if (targetNode === null || targetNodePos === null) return false;

      const docSize = doc.content.size; // Get the size of the document

      switch (direction) {
        case "up": {
          const insertPosUp = targetNodePos;

          // Ensure the insert position is within the document boundaries
          if (insertPosUp < 0 || insertPosUp > docSize) return false;

          if (insertPosUp === 0) {
            // If at the very start of the document, insert a new paragraph at the start
            editor.chain().insertContentAt(insertPosUp, { type: "paragraph" }).run();
            editor.chain().setTextSelection(insertPosUp).run(); // Set the cursor to the new paragraph
          } else {
            // Otherwise, check the node immediately before the target node
            const prevNode = doc.nodeAt(insertPosUp - 1);

            if (prevNode && prevNode.type.name === "paragraph") {
              // If the previous node is a paragraph, move the cursor there
              editor
                .chain()
                .setTextSelection(insertPosUp - 1)
                .run();
            } else {
              return false; // If the previous node is not a paragraph, do not proceed
            }
          }
          break;
        }

        case "down": {
          const insertPosDown = targetNodePos + (targetNode as ProseMirrorNode).nodeSize;

          // Ensure the insert position is within the document boundaries
          if (insertPosDown < 0 || insertPosDown > docSize) return false;

          // Check the node immediately after the target node
          const nextNode = doc.nodeAt(insertPosDown);

          if (nextNode && nextNode.type.name === "paragraph") {
            // If the next node is a paragraph, move the cursor to the end of it
            const endOfParagraphPos = insertPosDown + nextNode.nodeSize - 1;
            editor.chain().setTextSelection(endOfParagraphPos).run();
          } else if (!nextNode) {
            // If there is no next node (end of document), insert a new paragraph
            editor.chain().insertContentAt(insertPosDown, { type: "paragraph" }).run();
            editor
              .chain()
              .setTextSelection(insertPosDown + 1)
              .run(); // Set the cursor to the new paragraph
          } else {
            return false; // If the next node is not a paragraph, do not proceed
          }
          break;
        }

        default:
          return false; // If the direction is not recognized, do not proceed
      }

      return true; // Return true if the operation was successful
    } catch (error) {
      console.error(`An error occurred while inserting a line ${direction} the ${nodeType}:`, error);
      return false; // Return false if an error occurred
    }
  };
