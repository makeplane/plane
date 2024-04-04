import { useCallback, useEffect, useRef } from "react";
import tippy, { Instance } from "tippy.js";
import { Copy, LucideIcon, Trash2 } from "lucide-react";
import { Editor } from "@tiptap/react";

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

  const MENU_ITEMS: {
    icon: LucideIcon;
    key: string;
    label: string;
    onClick: (e: React.MouseEvent) => void;
  }[] = [
    {
      icon: Trash2,
      key: "delete",
      label: "Delete",
      onClick: (e) => {
        editor.chain().deleteSelection().focus();
        popup.current?.hide();
        e.preventDefault();
        e.stopPropagation();
      },
    },
    {
      icon: Copy,
      key: "duplicate",
      label: "Duplicate",
      onClick: (e) => {
        const { view } = editor;
        const { state } = view;
        const { selection } = state;
        const { $from, $to } = selection;
        const nodeType = $from.node($from.depth).type.name;

        // Check if the selection is within a list item
        if (nodeType === "listItem") {
          // Find the parent list node
          const listItemType = $from.node($from.depth).type;

          // Duplicate the entire list item
          const listItem = $from.node($from.depth);
          const duplicatedListItem = listItemType.createAndFill(listItem.attrs, listItem.content, listItem.marks);

          if (!duplicatedListItem) {
            return;
          }
          // Insert the duplicated list item into the list
          const transaction = state.tr.insert($to.pos, duplicatedListItem);
          editor.view.dispatch(transaction);
        } else {
          // Handle non-list items as before
          editor
            .chain()
            .insertContentAt(selection.to, selection.content().content.firstChild!.toJSON(), {
              updateSelection: true,
            })
            .focus(selection.to + 1, { scrollIntoView: false }) // Focus the editor at the end
            .run();
        }

        popup.current?.hide();
        e.preventDefault();
        e.stopPropagation();
      },
    },
  ];

  return (
    <div
      ref={menuRef}
      className="z-10 max-h-60 min-w-[7rem] overflow-y-scroll rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 shadow-custom-shadow-rg"
    >
      {MENU_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className="flex w-full items-center gap-2 truncate rounded px-1 py-1.5 text-xs text-custom-text-200 hover:bg-custom-background-80"
          onClick={item.onClick}
        >
          <item.icon className="h-3 w-3" />
          {item.label}
        </button>
      ))}
    </div>
  );
}
