import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Sortable } from "./sortable";

type StoryItem = { id: string; name: string };

const meta: Meta<typeof Sortable<StoryItem>> = {
  title: "Sortable",
  component: Sortable,
  args: {
    data: [
      { id: "1", name: "John Doe" },
      { id: "2", name: "Satish" },
      { id: "3", name: "Alice" },
      { id: "4", name: "Bob" },
      { id: "5", name: "Charlie" },
    ],
    render: (item: StoryItem) => (
      // <Draggable data={item} className="rounded-lg">
      <div className="border ">{item.name}</div>
      // </Draggable>
    ),
    onChange: (data) => console.log(data.map(({ id }) => id)),
    keyExtractor: (item) => item.id,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
