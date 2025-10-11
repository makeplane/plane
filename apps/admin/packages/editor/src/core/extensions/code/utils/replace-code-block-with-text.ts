import { Editor, findParentNode } from "@tiptap/core";

type ReplaceCodeBlockParams = {
  editor: Editor;
  from: number;
  to: number;
  textContent: string;
  cursorPosInsideCodeblock: number;
};

export function replaceCodeWithText(editor: Editor): void {
  try {
    const { from, to } = editor.state.selection;
    const cursorPosInsideCodeblock = from;
    let replaced = false;

    editor.state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type === editor.state.schema.nodes.codeBlock) {
        const startPos = pos;
        const endPos = pos + node.nodeSize;
        const textContent = node.textContent;

        if (textContent.length === 0) {
          editor.chain().focus().toggleCodeBlock().run();
        } else {
          transformCodeBlockToParagraphs({
            editor,
            from: startPos,
            to: endPos,
            textContent,
            cursorPosInsideCodeblock,
          });
        }

        replaced = true;
        return false;
      }
    });

    if (!replaced) {
      console.log("No code block to replace.");
    }
  } catch (error) {
    console.error("An error occurred while replacing code block content:", error);
  }
}

function transformCodeBlockToParagraphs({
  editor,
  from,
  to,
  textContent,
  cursorPosInsideCodeblock,
}: ReplaceCodeBlockParams): void {
  const { schema } = editor.state;
  const { paragraph } = schema.nodes;
  const docSize = editor.state.doc.content.size;

  if (from < 0 || to > docSize || from > to) {
    console.error("Invalid range for replacement: ", from, to, "in a document of size", docSize);
    return;
  }

  // Split the textContent by new lines to handle each line as a separate paragraph for Windows (\r\n) and Unix (\n)
  const lines = textContent.split(/\r?\n/);
  const tr = editor.state.tr;
  let insertPos = from;

  // Remove the code block first
  tr.delete(from, to);

  // For each line, create a paragraph node and insert it
  lines.forEach((line) => {
    // if the line is empty, create a paragraph node with no content
    const paragraphNode = line.length === 0 ? paragraph.create({}) : paragraph.create({}, schema.text(line));
    tr.insert(insertPos, paragraphNode);
    insertPos += paragraphNode.nodeSize;
  });

  // Now persist the focus to the converted paragraph
  const parentNodeOffset = findParentNode((node) => node.type === schema.nodes.codeBlock)(editor.state.selection)?.pos;

  if (parentNodeOffset === undefined) throw new Error("Invalid code block offset");

  const lineNumber = getLineNumber(textContent, cursorPosInsideCodeblock, parentNodeOffset);
  const cursorPosOutsideCodeblock = cursorPosInsideCodeblock + (lineNumber - 1);

  editor.view.dispatch(tr);
  editor.chain().focus(cursorPosOutsideCodeblock).run();
}

/**
 * Calculates the line number where the cursor is located inside the code block.
 * Assumes the indexing of the content inside the code block is like ProseMirror's indexing.
 *
 * @param {string} textContent - The content of the code block.
 * @param {number} cursorPosition - The absolute cursor position in the document.
 * @param {number} codeBlockNodePos - The starting position of the code block node in the document.
 * @returns {number} The 1-based line number where the cursor is located.
 */
function getLineNumber(textContent: string, cursorPosition: number, codeBlockNodePos: number): number {
  // Split the text content into lines, handling both Unix and Windows newlines
  const lines = textContent.split(/\r?\n/);
  const cursorPosInsideCodeblockRelative = cursorPosition - codeBlockNodePos;

  let startPosition = 0;
  let lineNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    // Calculate the end position of the current line
    const endPosition = startPosition + lines[i].length + 1; // +1 for the newline character

    // Check if the cursor position is within the current line
    if (cursorPosInsideCodeblockRelative >= startPosition && cursorPosInsideCodeblockRelative <= endPosition) {
      lineNumber = i + 1; // Line numbers are 1-based
      break;
    }

    // Update the start position for the next line
    startPosition = endPosition;
  }

  return lineNumber;
}
