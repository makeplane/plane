import { TableMenu } from "./component";
import { Extension } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { CellSelection } from "@tiptap/pm/tables";
import { Editor } from "@tiptap/react";

const generalMenuContainer = document.createElement("div");

const getTableParent = (node: Node): HTMLElement | null => {
  let currentNode: HTMLElement | null =
    node.nodeType === 1 ? (node as HTMLElement) : node.parentElement;

  while (currentNode) {
    if (currentNode.tagName === "TABLE") {
      return currentNode;
    }

    currentNode = currentNode.parentElement;
  }

  return null;
};
const handleUpdate = (editor: Editor): void => {
  const { selection } = editor.state;
  const isTextSelection = selection instanceof TextSelection;
  const isCellSelection = selection instanceof CellSelection;
  const selectedNode = selection.$from.node(1) || selection.$from.nodeAfter;

  if (
    !selectedNode ||
    !editor.isActive("table") ||
    isCellSelection ||
    !(isTextSelection && selection.empty)
  ) {
    generalMenuContainer.style.display = "none";

    return;
  }

  const { view } = editor;
  const node =
    view.nodeDOM(selection.$from.pos) ||
    view.nodeDOM(selection.$from.pos - selection.$from.parentOffset) ||
    view.domAtPos(selection.$from.pos)?.node;

  if (!node) return;

  const blockParent = getTableParent(node);
  const parentPos = document.getElementById("pm-container")?.getBoundingClientRect();
  const childPos = blockParent?.getBoundingClientRect();
  const tablePos = blockParent?.querySelector("tbody")?.getBoundingClientRect();

  if (!parentPos || !childPos) return;

  const relativePos = {
    top: childPos.top - parentPos.top,
    right: childPos.right - parentPos.right,
    bottom: childPos.bottom - parentPos.bottom,
    left: childPos.left - parentPos.left
  };

  generalMenuContainer.style.top = `${relativePos.top + (tablePos?.height || 0)}px`;
  generalMenuContainer.style.transform = `translate(${(tablePos?.width || 0) > 250 ? "-50%" : "0"
    },0.75rem)`;

  if ((tablePos?.width || 0) > 250) {
    generalMenuContainer.style.left = `${relativePos.left + Math.min(tablePos?.width || parentPos.width, parentPos.width) / 2
      }px`;
  } else {
    generalMenuContainer.style.left = "-0.25rem";
  }

  generalMenuContainer.style.display = "block";
  generalMenu?.setState({
    node: selectedNode,
    container: blockParent,
    editor
  });
};
const TableMenuPlugin = Extension.create({
  name: "tableMenu",
  onCreate() {
    generalMenu = new SolidRenderer(TableMenu, {
      editor: this.editor as SolidEditor,
      state: {
        container: null as HTMLElement | null,
        editor: this.editor as SolidEditor
      }
    });
    generalMenuContainer.style.position = "absolute";
    generalMenuContainer.style.top = "-100vh";
    generalMenuContainer.style.left = "-100vw";
    generalMenuContainer.appendChild(generalMenu.element);
    document.getElementById("pm-container")?.appendChild(generalMenuContainer);
  },
  onBlur() {
    const dropdownOpened = document.documentElement.classList.contains("dropdown-opened");

    if (
      (document.activeElement?.contains(generalMenuContainer) || dropdownOpened) &&
      breakpoints.md()
    ) {
      return;
    }

    generalMenuContainer.style.display = "none";
  },
  onFocus() {
    const isCellSelection = this.editor.state.selection instanceof CellSelection;

    if (this.editor.isActive("table") && !isCellSelection) {
      generalMenuContainer.style.display = "block";
    }
  },
  onUpdate() {
    handleUpdate(this.editor as SolidEditor);
  },
  onSelectionUpdate() {
    handleUpdate(this.editor as SolidEditor);
  }
});

export { TableMenuPlugin };
