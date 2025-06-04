import type { Meta, StoryObj } from "@storybook/react-webpack5";
import React from "react";
import { Table } from "./table";
import { TTableColumn } from "./types";

const tableData = [
  { id: "1", name: "Ernest", age: 25 },
  { id: "2", name: "Ann", age: 30 },
  { id: "3", name: "Russell", age: 35 },
  { id: "4", name: "Verna", age: 40 },
];

const tableColumns = [
  {
    key: "id",
    content: "Id",
    tdRender: (rowData) => <span>{rowData.id}</span>,
  },
  {
    key: "name",
    content: "Name",
    tdRender: (rowData) => <span>{rowData.name}</span>,
  },
  {
    key: "age",
    content: "Age",
    tdRender: (rowData) => <span>{rowData.age}</span>,
  },
] satisfies TTableColumn<typeof tableData[number]>[];

const meta: Meta<typeof Table<typeof tableData[number]>> = {
  title: "Table",
  component: Table,
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

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
