import type { Meta, StoryObj } from "@storybook/react-webpack5";
import React from "react";
import { Sortable } from "./sortable";

const data = [
  { id: "1", name: "John Doe" },
  { id: "2", name: "Satish" },
  { id: "3", name: "Alice" },
  { id: "4", name: "Bob" },
  { id: "5", name: "Charlie" },
];

const meta: Meta<typeof Sortable<(typeof data)[number]>> = {
  title: "Sortable",
  component: Sortable,
  args: {
    data,
    render: (item) => (
      // <Draggable data={item} className="rounded-lg">
      <div className="border ">{item.name}</div>
      // </Draggable>
    ),
    keyExtractor: (item) => item.id,
  },
  argTypes: {
    onChange: {
      action: true,
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
