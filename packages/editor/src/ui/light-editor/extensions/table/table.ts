import { Table as BaseTable } from "@tiptap/extension-table";

const Table = BaseTable.configure({
  resizable: true,
  cellMinWidth: 100,
  allowTableNodeSelection: true,
});

export { Table };
