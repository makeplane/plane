import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import React, { useState } from "react";
import { Select } from "./Select";
import { fruits } from "../../../data/fruits";
import { SelectButton } from "./SelectButton";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Example/SelectMenu",
  component: Select,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    items: [1, 2, 3, 4],
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { onChange: fn() },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const SingleSelect = () => {
  return (
    <Select
      items={fruits}
      renderItem={Fruit}
      onChange={function (value: any): void {
        console.log("Selected items", value);
      }}
      value={[3, 7, 9]}
      renderGroup={function (group: string): React.ReactNode {
        throw new Error("Function not implemented.");
      }}
      multiple
      defaultOpen
    >
      <SelectButton>Click Me!!</SelectButton>
    </Select>
  );
};

const Fruit = ({ fruit }) => {
  return <div>{`${fruit.emoji} ${fruit.name}`}</div>;
};
