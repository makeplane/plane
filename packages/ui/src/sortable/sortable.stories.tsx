import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Draggable } from "./draggable";
import { Sortable } from "./sortable";

const meta: Meta<typeof Sortable> = {
  title: "Sortable",
  component: Sortable,
};

export default meta;
type Story = StoryObj<typeof Sortable>;

const data = [
  { id: "1", name: "John Doe" },
  { id: "2", name: "Jane Doe" },
  { id: "3", name: "Alice" },
  { id: "4", name: "Bob" },
  { id: "5", name: "Charlie" },
];
export const Default: Story = {
  args: {
    data,
    render: (item: any) => (
      <Draggable data={item} className="rounded-lg">
        <div>{item.name}</div>
      </Draggable>
    ),
    onChange: (data) => console.log(data),
    keyExtractor: (item: any) => item.id,
  },
};
