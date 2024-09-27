import { useCallback, useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import tippy, { Instance } from "tippy.js";
import { Copy, LucideIcon, Trash2 } from "lucide-react";

interface BlockMenuProps {
  editor: Editor;
}

export const BlockMenu = (props: BlockMenuProps) => {
  const { editor } = props;
  const menuRef = useRef<HTMLDivElement>(null);
  const popup = useRef<Instance | null>(null);

  const handleClickDragHandle = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.matches("#drag-handle")) {
      event.preventDefault();

      popup.current?.setProps({
        getReferenceClientRect: () => target.getBoundingClientRect(),
      });

      popup.current?.show();
      return;
    }

    popup.current?.hide();
    return;
  }, []);

  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.remove();
      menuRef.current.style.visibility = "visible";

      popup.current = tippy(document.body, {
        getReferenceClientRect: null,
        content: menuRef.current,
        appendTo: () => document.querySelector(".frame-renderer"),
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
    const handleKeyDown = () => {
      popup.current?.hide();
    };

    const handleScroll = () => {
      popup.current?.hide();
    };
    document.addEventListener("click", handleClickDragHandle);
    document.addEventListener("contextmenu", handleClickDragHandle);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("scroll", handleScroll, true); // Using capture phase

    return () => {
      document.removeEventListener("click", handleClickDragHandle);
      document.removeEventListener("contextmenu", handleClickDragHandle);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [handleClickDragHandle]);

  const MENU_ITEMS: {
    icon: LucideIcon;
    key: string;
    label: string;
    onClick: (e: React.MouseEvent) => void;
    isDisabled?: boolean;
  }[] = [
    {
      icon: Trash2,
      key: "delete",
      label: "Delete",
      onClick: (e) => {
        editor.chain().deleteSelection().focus().run();
        popup.current?.hide();
        e.preventDefault();
        e.stopPropagation();
      },
    },
    {
      icon: Copy,
      key: "duplicate",
      label: "Duplicate",
      isDisabled:
        editor.state.selection.content().content.firstChild?.type.name === "image" || editor.isActive("imageComponent"),
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
          const { state } = editor;
          const { selection } = state;
          const firstChild = selection.content().content.firstChild;
          const docSize = state.doc.content.size;

          if (!firstChild) {
            throw new Error("No content selected or content is not duplicable.");
          }

          // Directly use selection.to as the insertion position
          const insertPos = selection.to;

          // Ensure the insertion position is within the document's bounds
          if (insertPos < 0 || insertPos > docSize) {
            throw new Error("The insertion position is invalid or outside the document.");
          }

          const contentToInsert = firstChild.toJSON();

          // Insert the content at the calculated position
          editor
            .chain()
            .insertContentAt(insertPos, contentToInsert, {
              updateSelection: true,
            })
            .focus(Math.min(insertPos + 1, docSize), { scrollIntoView: false })
            .run();
        } catch (error) {
          if (error instanceof Error) {
            console.error(error.message);
          }
        }

        popup.current?.hide();
      },
    },
  ];

  return (
    <div
      ref={menuRef}
      className="z-10 max-h-60 min-w-[7rem] overflow-y-scroll rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 shadow-custom-shadow-rg"
    >
      {MENU_ITEMS.map((item) => {
        // Skip rendering the button if it should be disabled
        if (item.isDisabled && item.key === "duplicate") {
          return null;
        }

        return (
          <button
            key={item.key}
            type="button"
            className="flex w-full items-center gap-2 truncate rounded px-1 py-1.5 text-xs text-custom-text-200 hover:bg-custom-background-80"
            onClick={item.onClick}
            disabled={item.isDisabled}
          >
            <item.icon className="h-3 w-3" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
