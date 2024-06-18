import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Sortable } from "./sortable";

const meta: Meta<typeof Sortable> = {
  title: "Sortable",
  component: Sortable,
};

export default meta;
type Story = StoryObj<typeof Sortable>;

const data = [
  { id: "1", name: "John Doe" },
  { id: "2", name: "Satish" },
  { id: "3", name: "Alice" },
  { id: "4", name: "Bob" },
  { id: "5", name: "Charlie" },
];
export const Default: Story = {
  args: {
    data,
    render: (item: any) => (
      // <Draggable data={item} className="rounded-lg">
      <div className="border ">{item.name}</div>
      // </Draggable>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (data) => console.log(data.map(({ id }: any) => id)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyExtractor: (item: any) => item.id,
  },
};
