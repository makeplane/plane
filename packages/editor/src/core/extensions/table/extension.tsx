import { Extension, Mark, Node } from "@tiptap/core";
import { Table } from "./table";
import { TableCell } from "./table-cell";
import { TableHeader } from "./table-header";
import { TableRow } from "./table-row";

export const CustomTableExtension: (Extension<any, any> | Node<any, any> | Mark<any, any>)[] = [
  Table,
  TableHeader,
  TableCell,
  TableRow,
];
