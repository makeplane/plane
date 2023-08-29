import { useState, useEffect } from "react";
import { Rows, Columns } from "lucide-react";
import { cn } from "../utils";

interface TableMenuItem {
  name: string;
  command: () => void;
  icon: any;
}

const findTableAncestor = (node: Node | null): HTMLTableElement | null => {
  while (node !== null && node.nodeName !== "TABLE") {
    node = node.parentNode;
  }
  return node as HTMLTableElement;
};

export const TableMenu = ({ editor }: { editor: any }) => {
  const [tableLocation, setTableLocation] = useState(0);
  const items: TableMenuItem[] = [
    {
      name: "Insert column right",
      command: () => editor.chain().focus().addColumnBefore().run(),
      icon: Columns,
    },
    {
      name: "Insert row below",
      command: () => editor.chain().focus().addRowAfter().run(),
      icon: Rows,
    },
    {
      name: "Delete Column",
      command: () => editor.chain().focus().deleteColumn().run(),
      icon: Columns,
    },
    {
      name: "Delete Rows",
      command: () => editor.chain().focus().deleteRow().run(),
      icon: Rows,
    }
  ];

  useEffect(() => {
    const handleWindowClick = () => {
      const selection: any = window.getSelection();
      const range = selection.getRangeAt(0);
      const tableNode = findTableAncestor(range.startContainer);
      if (tableNode) {
        const tableBottom = tableNode.getBoundingClientRect().bottom;
        tableLocation !== tableBottom && setTableLocation(tableBottom);
      }
    };

    window.addEventListener("click", handleWindowClick);

    return () => {
      window.removeEventListener("click", handleWindowClick);
    };
  }, [tableLocation]);

  return (
    <section
      className="fixed left-2/4 transform -translate-x-2/4 overflow-hidden rounded border border-stone-200 bg-white shadow-xl"
      style={{ bottom: `calc(100vh - ${tableLocation + 50}px)` }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={item.command}
          className="p-2 text-stone-600 hover:bg-stone-100 active:bg-stone-200"
          title={item.name}
        >
          <item.icon
            className={cn("h-5 w-5 text-lg", {
              "text-red-600": item.name.includes("Delete"),
            })}
          />
        </button>
      ))}
    </section>
  );
};
