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
      const { $from } = selection;

      const node = doc.nodeAt($from.pos);
      const pos = $from.pos;

      if (!node || node.type.name !== nodeType) return false;

      const docSize = doc.content.size; // Get the size of the document

      switch (direction) {
        case "up": {
          const insertPosUp = pos;

          // Ensure the insert position is within the document boundaries
          if (insertPosUp < 0 || insertPosUp > docSize) return false;

          // Check if we're exactly at the start of the document
          if (insertPosUp === 0) {
            // We are at the true start of the document, safe to insert
            editor.chain().insertContentAt(0, { type: "paragraph" }).run();
            editor.chain().setTextSelection(0).run(); // Set the cursor to the start of the new paragraph
          } else {
            // Check the node immediately before the target node
            const prevNode = doc.nodeAt(insertPosUp - 1);

            if (prevNode && prevNode.type.name === "paragraph") {
              // If the previous node is a paragraph, move the cursor there
              const startOfParagraphPos = insertPosUp - prevNode.nodeSize;
              editor.chain().setTextSelection(startOfParagraphPos).run();
            } else {
              return false; // If the previous node is not a paragraph, do not proceed
            }
          }
          break;
        }

        case "down": {
          const insertPosDown = pos + (node as ProseMirrorNode).nodeSize;

          // Ensure the insert position is within the document boundaries
          if (insertPosDown < 0 || insertPosDown > docSize) return false;

          // Check if we're exactly at the end of the document
          if (insertPosDown === docSize) {
            // We are at the true end of the document, safe to insert
            editor.chain().insertContentAt(insertPosDown, { type: "paragraph" }).run();
            editor
              .chain()
              .setTextSelection(insertPosDown + 1)
              .run(); // Set the cursor to the new paragraph
          } else {
            // Check the node immediately after the target node
            const nextNode = doc.nodeAt(insertPosDown);

            if (nextNode && nextNode.type.name === "paragraph") {
              // If the next node is a paragraph, move the cursor to the end of it
              const endOfParagraphPos = insertPosDown + nextNode.nodeSize - 1;
              editor.chain().setTextSelection(endOfParagraphPos).run();
            } else {
              return false; // If the next node is not a paragraph, do not proceed
            }
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
