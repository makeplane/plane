import { BubbleMenu, BubbleMenuProps } from "@tiptap/react";
import { FC, useState, useEffect } from "react";
import { Rows, Columns, BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, CodeIcon } from "lucide-react";

import { cn } from "../utils";
import { ToggleOn } from "@mui/icons-material";

export interface TableMenuItem {
  name: string;
  isActive?: () => boolean;
  command: () => void;
  icon: typeof Rows;
}

type EditorTableMenuProps = Omit<BubbleMenuProps, "children">;

export const TableMenu: FC<EditorTableMenuProps> = (props: any) => {
  const items: TableMenuItem[] = [
    {
      name: "Add Column to Right",
      command: () => props.editor?.chain().focus().addColumnAfter().run(),
      icon: Columns,
    },
    {
      name: "Toggle table header",
      command: () => props.editor?.chain().focus().toggleHeaderRow().run(),
      icon: ToggleOn,
    },
    {
      name: "Add Column to Left",
      command: () => props.editor?.chain().focus().addColumnBefore().run(),
      icon: Columns,
    },
    {
      name: "Add Row to Top",
      command: () => props.editor?.chain().focus().addRowBefore().run(),
      icon: Rows,
    },
    {
      name: "Add Row Below",
      command: () => props.editor?.chain().focus().addRowAfter().run(),
      icon: Rows,
    },
    {
      name: "Delete Column",
      command: () => props.editor?.chain().focus().deleteColumn().run(),
      icon: Columns,
    },
    {
      name: "Delete Rows",
      command: () => props.editor?.chain().focus().deleteRow().run(),
      icon: Rows,
    }
  ];

  const tableMenuProps: EditorTableMenuProps = {
    ...props,
    shouldShow: ({ editor }) => {
      if (!editor.isEditable) {
        return false;
      }
      if (editor?.isActive("table")) {
        return true;
      }
    },
    tippyOptions: {
      moveTransition: "transform 0.15s ease-out",
    },
  };

  return (
    <BubbleMenu
      {...tableMenuProps}
      className="flex w-fit divide-x divide-custom-border-300 rounded border border-custom-border-300 bg-custom-background-100 shadow-xl"
    >
      <div className="flex">
        {items.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={item.command}
            className={cn(
              "p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors"
            )}
          >
            <item.icon
              className={cn("h-4 w-4")}
            />
          </button>
        ))}
      </div>
    </BubbleMenu>
  );
};
