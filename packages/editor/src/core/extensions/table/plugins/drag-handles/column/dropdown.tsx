import type { Editor } from "@tiptap/core";
import { TableMap } from "@tiptap/pm/tables";
import { ArrowLeft, ArrowRight, Copy, ToggleRight, Trash2, X, type LucideIcon } from "lucide-react";
// extensions
import { findTable, getSelectedColumns } from "@/extensions/table/table/utilities/helpers";
// local imports
import { duplicateColumns } from "../actions";
import { TableDragHandleDropdownColorSelector } from "../color-selector";

const DROPDOWN_ITEMS: {
  key: string;
  label: string;
  icon: LucideIcon;
  action: (editor: Editor) => void;
}[] = [
  {
    key: "insert-left",
    label: "Insert left",
    icon: ArrowLeft,
    action: (editor) => editor.chain().focus().addColumnBefore().run(),
  },
  {
    key: "insert-right",
    label: "Insert right",
    icon: ArrowRight,
    action: (editor) => editor.chain().focus().addColumnAfter().run(),
  },
  {
    key: "duplicate",
    label: "Duplicate",
    icon: Copy,
    action: (editor) => {
      const table = findTable(editor.state.selection);
      if (!table) return;

      const tableMap = TableMap.get(table.node);
      let tr = editor.state.tr;
      const selectedColumns = getSelectedColumns(editor.state.selection, tableMap);
      tr = duplicateColumns(table, selectedColumns, tr);
      editor.view.dispatch(tr);
    },
  },
  {
    key: "clear-contents",
    label: "Clear contents",
    icon: X,
    action: (editor) => editor.chain().focus().clearSelectedCells().run(),
  },
  {
    key: "delete",
    label: "Delete",
    icon: Trash2,
    action: (editor) => editor.chain().focus().deleteColumn().run(),
  },
];

type Props = {
  editor: Editor;
  onClose: () => void;
};

export const ColumnOptionsDropdown: React.FC<Props> = (props) => {
  const { editor, onClose } = props;

  return (
    <>
      <button
        type="button"
        className="flex items-center justify-between gap-2 w-full rounded px-1 py-1.5 text-xs text-left truncate text-custom-text-200 hover:bg-custom-background-80"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          editor.chain().focus().toggleHeaderColumn().run();
          onClose();
        }}
      >
        <div className="flex-grow truncate">Header column</div>
        <ToggleRight className="shrink-0 size-3" />
      </button>
      <hr className="my-2 border-custom-border-200" />
      <TableDragHandleDropdownColorSelector editor={editor} onSelect={onClose} />
      {DROPDOWN_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className="flex items-center gap-2 w-full rounded px-1 py-1.5 text-xs text-left truncate text-custom-text-200 hover:bg-custom-background-80"
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
};
