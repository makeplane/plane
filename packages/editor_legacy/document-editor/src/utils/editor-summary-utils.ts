import { Editor } from "@tiptap/react";
import { IMarking } from "src/types/editor-types";

function findNthH1(editor: Editor, n: number, level: number): number {
  let count = 0;
  let pos = 0;
  editor.state.doc.descendants((node, position) => {
    if (node.type.name === "heading" && node.attrs.level === level) {
      count++;
      if (count === n) {
        pos = position;
        return false;
      }
    }
  });
  return pos;
}

function scrollToNode(editor: Editor, pos: number): void {
  const headingNode = editor.state.doc.nodeAt(pos);
  if (headingNode) {
    const headingDOM = editor.view.nodeDOM(pos);
    if (headingDOM instanceof HTMLElement) {
      headingDOM.scrollIntoView({ behavior: "smooth" });
    }
  }
}

export function scrollSummary(editor: Editor, marking: IMarking) {
  if (editor) {
    const pos = findNthH1(editor, marking.sequence, marking.level);
    scrollToNode(editor, pos);
  }
}
