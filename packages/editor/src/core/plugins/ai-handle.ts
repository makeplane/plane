import { NodeSelection } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
// extensions
import { SideMenuHandleOptions, SideMenuPluginProps } from "@/extensions";
// plugins
import { nodeDOMAtCoords } from "@/plugins/drag-handle";

const sparklesIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>';

const nodePosAtDOM = (node: Element, view: EditorView, options: SideMenuPluginProps) => {
  const boundingRect = node.getBoundingClientRect();

  return view.posAtCoords({
    left: boundingRect.left + 50 + options.dragHandleWidth,
    top: boundingRect.top + 1,
  })?.inside;
};

const nodePosAtDOMForBlockQuotes = (node: Element, view: EditorView) => {
  const boundingRect = node.getBoundingClientRect();

  return view.posAtCoords({
    left: boundingRect.left + 1,
    top: boundingRect.top + 1,
  })?.inside;
};

const calcNodePos = (pos: number, view: EditorView, node: Element) => {
  const maxPos = view.state.doc.content.size;
  const safePos = Math.max(0, Math.min(pos, maxPos));
  const $pos = view.state.doc.resolve(safePos);

  if ($pos.depth > 1) {
    if (node.matches("ul li, ol li")) {
      // only for nested lists
      const newPos = $pos.before($pos.depth);
      return Math.max(0, Math.min(newPos, maxPos));
    }
  }

  return safePos;
};

export const AIHandlePlugin = (options: SideMenuPluginProps): SideMenuHandleOptions => {
  let aiHandleElement: HTMLButtonElement | null = null;

  const handleClick = (event: MouseEvent, view: EditorView) => {
    view.focus();

    const node = nodeDOMAtCoords({
      x: event.clientX + 50 + options.dragHandleWidth,
      y: event.clientY,
    });

    if (!(node instanceof Element)) return;

    if (node.matches("blockquote")) {
      let nodePosForBlockQuotes = nodePosAtDOMForBlockQuotes(node, view);
      if (nodePosForBlockQuotes === null || nodePosForBlockQuotes === undefined) return;

      const docSize = view.state.doc.content.size;
      nodePosForBlockQuotes = Math.max(0, Math.min(nodePosForBlockQuotes, docSize));

      if (nodePosForBlockQuotes >= 0 && nodePosForBlockQuotes <= docSize) {
        // TODO FIX ERROR
        const nodeSelection = NodeSelection.create(view.state.doc, nodePosForBlockQuotes);
        view.dispatch(view.state.tr.setSelection(nodeSelection));
      }
      return;
    }

    let nodePos = nodePosAtDOM(node, view, options);

    if (nodePos === null || nodePos === undefined) return;

    // Adjust the nodePos to point to the start of the node, ensuring NodeSelection can be applied
    nodePos = calcNodePos(nodePos, view, node);

    // TODO FIX ERROR
    // Use NodeSelection to select the node at the calculated position
    const nodeSelection = NodeSelection.create(view.state.doc, nodePos);

    // Dispatch the transaction to update the selection
    view.dispatch(view.state.tr.setSelection(nodeSelection));
  };

  const view = (view: EditorView, sideMenu: HTMLDivElement | null) => {
    // create handle element
    const className =
      "grid place-items-center font-medium size-5 aspect-square text-xs text-custom-text-300 hover:bg-custom-background-80 rounded-sm opacity-100 !outline-none z-[5] transition-[background-color,_opacity] duration-200 ease-linear";
    aiHandleElement = document.createElement("button");
    aiHandleElement.type = "button";
    aiHandleElement.id = "ai-handle";
    aiHandleElement.classList.value = className;
    const iconElement = document.createElement("span");
    iconElement.classList.value = "pointer-events-none";
    iconElement.innerHTML = sparklesIcon;
    aiHandleElement.appendChild(iconElement);
    // bind events
    aiHandleElement.addEventListener("click", (e) => handleClick(e, view));

    sideMenu?.appendChild(aiHandleElement);

    return {
      // destroy the handle element on un-initialize
      destroy: () => {
        aiHandleElement?.remove();
        aiHandleElement = null;
      },
    };
  };

  const domEvents = {};

  return {
    view,
    domEvents,
  };
};
