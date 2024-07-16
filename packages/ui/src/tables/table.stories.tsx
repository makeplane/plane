import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Table } from "./table";

const meta: Meta<typeof Table> = {
  title: "Table",
  component: Table,
};

export default meta;

// types
type TTableData = {
  id: string;
  name: string;
  age: number;
};

type Story = StoryObj<typeof Table<TTableData>>;

// data
const tableData: TTableData[] = [
  { id: "1", name: "Ernest", age: 25 },
  { id: "2", name: "Ann", age: 30 },
  { id: "3", name: "Russell", age: 35 },
  { id: "4", name: "Verna", age: 40 },
];

const tableColumns = [
  {
    key: "id",
    content: "Id",
    tdRender: (rowData: TTableData) => <span>{rowData.id}</span>,
  },
  {
    key: "name",
    content: "Name",
    tdRender: (rowData: TTableData) => <span>{rowData.name}</span>,
  },
  {
    key: "age",
    content: "Age",
    tdRender: (rowData: TTableData) => <span>{rowData.age}</span>,
  },
];

// stories
export const Default: Story = {
  args: {
    data: tableData,
    columns: tableColumns,
    keyExtractor: (rowData) => rowData.id,
    tableClassName: "bg-gray-100",
    tHeadClassName: "bg-gray-200",
    tHeadTrClassName: "text-gray-600 text-left text-sm font-medium",
    thClassName: "font-medium",
    tBodyClassName: "bg-gray-100",
    tBodyTrClassName: "text-gray-600",
    tdClassName: "font-medium",
  },
};
