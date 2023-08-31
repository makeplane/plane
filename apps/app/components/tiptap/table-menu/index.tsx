import { useState, useEffect } from "react";
import { Rows, Columns, ToggleRight } from "lucide-react";
import { cn } from "../utils";
import { Tooltip } from "components/ui";

interface TableMenuItem {
  command: () => void;
  icon: any;
  key: string;
  name: string;
}

export const findTableAncestor = (node: Node | null): HTMLTableElement | null => {
  while (node !== null && node.nodeName !== "TABLE") {
    node = node.parentNode;
  }
  return node as HTMLTableElement;
};

export const TableMenu = ({ editor }: { editor: any }) => {
  const [tableLocation, setTableLocation] = useState({ bottom: 0, left: 0 });
  const isOpen = editor?.isActive("table");

  const items: TableMenuItem[] = [
    {
      command: () => editor.chain().focus().addColumnBefore().run(),
      icon: Columns,
      key: "insert-column-right",
      name: "Insert 1 column right",
    },
    {
      command: () => editor.chain().focus().addRowAfter().run(),
      icon: Rows,
      key: "insert-row-below",
      name: "Insert 1 row below",
    },
    {
      command: () => editor.chain().focus().deleteColumn().run(),
      icon: Columns,
      key: "delete-column",
      name: "Delete column",
    },
    {
      command: () => editor.chain().focus().deleteRow().run(),
      icon: Rows,
      key: "delete-row",
      name: "Delete row",
    },
    {
      command: () => editor.chain().focus().toggleHeaderRow().run(),
      icon: ToggleRight,
      key: "toggle-header-row",
      name: "Toggle header row",
    },
  ];

  useEffect(() => {
    if (!window) return;

    const handleWindowClick = () => {
      const selection: any = window?.getSelection();

      if (selection.rangeCount !== 0) {
        const range = selection.getRangeAt(0);
        const tableNode = findTableAncestor(range.startContainer);

        let parent = tableNode?.parentElement;

        if (tableNode) {
          const tableRect = tableNode.getBoundingClientRect();
          const tableCenter = tableRect.left + tableRect.width / 2;
          const menuWidth = 45;
          const menuLeft = tableCenter - menuWidth / 2;
          const tableBottom = tableRect.bottom;

          setTableLocation({ bottom: tableBottom, left: menuLeft });

          while (parent) {
            if (!parent.classList.contains("disable-scroll"))
              parent.classList.add("disable-scroll");
            parent = parent.parentElement;
          }
        } else {
          const scrollDisabledContainers = document.querySelectorAll(".disable-scroll");

          scrollDisabledContainers.forEach((container) => {
            container.classList.remove("disable-scroll");
          });
        }
      }
    };

    window.addEventListener("click", handleWindowClick);

    return () => {
      window.removeEventListener("click", handleWindowClick);
    };
  }, [tableLocation, editor]);

  return (
    <section
      className={`fixed left-1/2 transform -translate-x-1/2 overflow-hidden rounded border border-custom-border-300 bg-custom-background-100 shadow-custom-shadow-sm p-1 ${
        isOpen ? "block" : "hidden"
      }`}
      style={{
        bottom: `calc(100vh - ${tableLocation.bottom + 45}px)`,
        left: `${tableLocation.left}px`,
      }}
    >
      {items.map((item, index) => (
        <Tooltip key={index} tooltipContent={item.name}>
          <button
            onClick={item.command}
            className="p-1.5 text-custom-text-200 hover:bg-text-custom-text-100 hover:bg-custom-background-80 active:bg-custom-background-80 rounded"
            title={item.name}
          >
            <item.icon
              className={cn("h-4 w-4 text-lg", {
                "text-red-600": item.key.includes("delete"),
              })}
            />
          </button>
        </Tooltip>
      ))}
    </section>
  );
};
