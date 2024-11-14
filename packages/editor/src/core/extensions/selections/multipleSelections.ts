import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

const MultipleSelectionPluginKey = new PluginKey("multipleSelection");

let activeCursor: HTMLElement | null = null;
const lastActiveSelection = {
  top: 0,
  left: 0,
};

const updateCursorPosition = (event: MouseEvent) => {
  if (!activeCursor) return;

  let newHeight = event.y - lastActiveSelection.top;
  let newWidth = event.x - lastActiveSelection.left;

  if (newHeight < 0) {
    activeCursor.style.marginTop = `${newHeight}px`;
    newHeight *= -1;
  } else {
    activeCursor.style.marginTop = "0px";
  }

  if (newWidth < 0) {
    activeCursor.style.marginLeft = `${newWidth}px`;
    newWidth *= -1;
  } else {
    activeCursor.style.marginLeft = "0px";
  }

  activeCursor.style.height = `${newHeight}px`;
  activeCursor.style.width = `${newWidth}px`;
};

const removeActiveUser = () => {
  if (!activeCursor) return;

  activeCursor.remove();
  activeCursor = null;
  // Clean up global event listeners
  document.removeEventListener("mousemove", updateCursorPosition);
  document.removeEventListener("mouseup", removeActiveUser);
};

const createMultipleSelectionPlugin = () =>
  new Plugin({
    key: MultipleSelectionPluginKey,
    props: {
      handleDOMEvents: {
        mousedown(view: EditorView<any>, event: MouseEvent) {
          if (event.target !== view.dom) {
            return false;
          }

          // Clean up any existing selection
          removeActiveUser();

          // Create new selection
          activeCursor = document.createElement("div");
          activeCursor.className = "multipleSelectionCursor";
          activeCursor.style.width = "0px";
          activeCursor.style.height = "0px";
          activeCursor.style.borderRadius = "2px";
          activeCursor.style.border = "1px solid rgba(var(--color-primary-100), 0.2)";
          activeCursor.style.background = "rgba(var(--color-primary-100), 0.2)";
          activeCursor.style.opacity = "0.5";
          activeCursor.style.position = "absolute";
          activeCursor.style.top = `${event.y}px`;
          activeCursor.style.left = `${event.x}px`;
          activeCursor.style.pointerEvents = "none"; // Prevent cursor from intercepting events

          lastActiveSelection.top = event.y;
          lastActiveSelection.left = event.x;

          document.body.appendChild(activeCursor);

          // Add global event listeners
          document.addEventListener("mousemove", updateCursorPosition);
          document.addEventListener("mouseup", removeActiveUser);

          return false;
        },
      },
    },
    destroy() {
      removeActiveUser();
    },
  });

export const multipleSelectionExtension = Extension.create({
  name: "multipleSelection",
  addProseMirrorPlugins: () => [createMultipleSelectionPlugin()],
});
