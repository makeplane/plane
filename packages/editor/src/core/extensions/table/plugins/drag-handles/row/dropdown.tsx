import type { Editor } from "@tiptap/core";
import { TableMap } from "@tiptap/pm/tables";
import { ArrowDown, ArrowUp, ToggleRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
// extensions
import type { ISvgIcons } from "@plane/propel/icons";
import { CopyIcon, TrashIcon, CloseIcon } from "@plane/propel/icons";
import { findTable, getSelectedRows } from "@/extensions/table/table/utilities/helpers";
// local imports
import { duplicateRows } from "../actions";
import { TableDragHandleDropdownColorSelector } from "../color-selector";

const DROPDOWN_ITEMS: {
  key: string;
  label: string;
  icon: LucideIcon | React.FC<ISvgIcons>;
  action: (editor: Editor) => void;
}[] = [
  {
    key: "insert-above",
    label: "Insert above",
    icon: ArrowUp,
    action: (editor) => editor.chain().focus().addRowBefore().run(),
  },
  {
    key: "insert-below",
    label: "Insert below",
    icon: ArrowDown,
    action: (editor) => editor.chain().focus().addRowAfter().run(),
  },
  {
    key: "duplicate",
    label: "Duplicate",
    icon: CopyIcon,
    action: (editor) => {
      const table = findTable(editor.state.selection);
      if (!table) return;

      const tableMap = TableMap.get(table.node);
      let tr = editor.state.tr;
      const selectedRows = getSelectedRows(editor.state.selection, tableMap);
      tr = duplicateRows(table, selectedRows, tr);
      editor.view.dispatch(tr);
    },
  },
  {
    key: "clear-contents",
    label: "Clear contents",
    icon: CloseIcon,
    action: (editor) => editor.chain().focus().clearSelectedCells().run(),
  },
  {
    key: "delete",
    label: "Delete",
    icon: TrashIcon,
    action: (editor) => editor.chain().focus().deleteRow().run(),
  },
];

type Props = {
  editor: Editor;
  onClose: () => void;
};

export function RowOptionsDropdown(props: Props) {
  const { editor, onClose } = props;

  return (
    <>
      <button
        type="button"
        className="flex items-center justify-between gap-2 w-full rounded-sm px-1 py-1.5 text-11 text-left truncate text-secondary hover:bg-layer-1"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          editor.chain().focus().toggleHeaderRow().run();
          onClose();
        }}
      >
        <div className="flex-grow truncate">Header row</div>
        <ToggleRight className="shrink-0 size-3" />
      </button>
      <hr className="my-2 border-subtle" />
      <TableDragHandleDropdownColorSelector editor={editor} onSelect={onClose} />
      {DROPDOWN_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className="flex items-center gap-2 w-full rounded-sm px-1 py-1.5 text-11 text-left truncate text-secondary hover:bg-layer-1"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            item.action(editor);
            onClose();
          }}
        >
          <item.icon className="shrink-0 size-3" />
          <div className="flex-grow truncate">{item.label}</div>
        </button>
      ))}
    </>
  );
}
