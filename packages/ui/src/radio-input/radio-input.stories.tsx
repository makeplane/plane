import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { RadioInput } from "./radio-input";

const meta: Meta<typeof RadioInput> = {
  title: "RadioInput",
  component: RadioInput,
};

export default meta;
type Story = StoryObj<typeof RadioInput>;

const options = [
  { label: "Option 1", value: "option1" },
  {
    label:
      "A very very long label, lets add some lipsum text and see what happens? May be we don't have to. This is long enough",
    value: "option2",
  },
  { label: "Option 3", value: "option3" },
];

export const Default: Story = {
  args: {
    options,
    label: "Horizontal Radio Input",
  },
};

export const vertical: Story = {
  args: {
    options,
    label: "Vertical Radio Input",
    vertical: true,
  },
};
