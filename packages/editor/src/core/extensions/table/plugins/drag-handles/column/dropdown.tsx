import type { Editor } from "@tiptap/core";
import { TableMap } from "@tiptap/pm/tables";
import { ArrowLeft, ArrowRight, ToggleRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
// extensions
import type { ISvgIcons } from "@plane/propel/icons";
import { CopyIcon, TrashIcon, CloseIcon } from "@plane/propel/icons";
import { findTable, getSelectedColumns } from "@/extensions/table/table/utilities/helpers";
// local imports
import { duplicateColumns } from "../actions";
import { TableDragHandleDropdownColorSelector } from "../color-selector";

const DROPDOWN_ITEMS: {
  key: string;
  label: string;
  icon: LucideIcon | React.FC<ISvgIcons>;
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
    icon: CopyIcon,
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
    icon: CloseIcon,
    action: (editor) => editor.chain().focus().clearSelectedCells().run(),
  },
  {
    key: "delete",
    label: "Delete",
    icon: TrashIcon,
    action: (editor) => editor.chain().focus().deleteColumn().run(),
  },
];

type Props = {
  editor: Editor;
  onClose: () => void;
};

export function ColumnOptionsDropdown(props: Props) {
  const { editor, onClose } = props;

  return (
    <>
      <button
        type="button"
        className="flex items-center justify-between gap-2 w-full rounded-sm px-1 py-1.5 text-11 text-left truncate text-secondary hover:bg-layer-1"
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
