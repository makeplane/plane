/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table } from "./table";

const meta = {
  title: "Table",
  component: Table<TTableData>,
} satisfies Meta<typeof Table<TTableData>>;

export default meta;

// types
type TTableData = {
  id: string;
  name: string;
  age: number;
};

type Story = StoryObj<typeof meta>;

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
    tHeadTrClassName: "text-gray-600 text-left text-13 font-medium",
    thClassName: "font-medium",
    tBodyClassName: "bg-gray-100",
    tBodyTrClassName: "text-gray-600",
    tdClassName: "font-medium",
  },
};
