import { useCallback, useEffect, useRef } from "react";
import tippy, { Instance } from "tippy.js";

import { Editor } from "@tiptap/react";
import { CopyIcon, DeleteIcon } from "lucide-react";

interface BlockMenuProps {
  editor: Editor;
}

export default function BlockMenu(props: BlockMenuProps) {
  const { editor } = props;
  const { view } = editor;
  const menuRef = useRef<HTMLDivElement>(null);
  const popup = useRef<Instance | null>(null);

  const handleClickDragHandle = useCallback(
    (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches(".drag-handle-dots") || target.matches(".drag-handle-dot")) {
        event.preventDefault();

        popup.current?.setProps({
          getReferenceClientRect: () => target.getBoundingClientRect(),
        });

        popup.current?.show();
        return;
      }

      popup.current?.hide();
      return;
    },
    [view]
  );

  const handleKeyDown = () => {
    popup.current?.hide();
  };

  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.remove();
      menuRef.current.style.visibility = "visible";

      popup.current = tippy(view.dom, {
        getReferenceClientRect: null,
        content: menuRef.current,
        appendTo: "parent",
        trigger: "manual",
        interactive: true,
        arrow: false,
        placement: "left-start",
        animation: "shift-away",
        maxWidth: 500,
        hideOnClick: true,
        onShown: () => {
          menuRef.current?.focus();
        },
      });
    }

    return () => {
      popup.current?.destroy();
      popup.current = null;
    };
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClickDragHandle);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleClickDragHandle);
      document.addEventListener("keydown", handleKeyDown);
    };
  }, [handleClickDragHandle]);

  return (
    <div
      ref={menuRef}
      className="z-50 max-h-[300px] w-24 overflow-y-auto rounded-lg border border-gray-200 bg-white px-1 py-2 shadow-lg"
    >
      <button
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
        onClick={(e) => {
          editor.commands.deleteSelection();
          popup.current?.hide();
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="grid place-items-center">
          <DeleteIcon className="h-3 w-3" />
        </div>
        <p className="truncate">Delete</p>
      </button>

      <button
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
        onClick={(e) => {
          const { view } = editor;
          const { state } = view;
          const { selection } = state;

          editor
            .chain()
            .insertContentAt(selection.to, selection.content().content.firstChild!.toJSON(), {
              updateSelection: true,
            })
            .focus(selection.to + 1, { scrollIntoView: false }) // Focus the editor at the end
            .run();

          popup.current?.hide();
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="grid place-items-center">
          <CopyIcon className="h-3 w-3" />
        </div>
        <p className="truncate">Duplicate</p>
      </button>
    </div>
  );
}
