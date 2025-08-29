import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { EmojiPicker } from "./emoji-picker";
import { EmojiIconPickerTypes } from "./helper";

const meta: Meta<typeof EmojiPicker> = {
  title: "EmojiPicker",
  component: EmojiPicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EmojiPicker>;

const EmojiPickerWithState = (args: React.ComponentProps<typeof EmojiPicker>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<any>(null);

  return (
    <div className="space-y-4">
      <EmojiPicker
        {...args}
        isOpen={isOpen}
        handleToggle={setIsOpen}
        onChange={(value) => {
          setSelectedValue(value);
          console.log("Selected:", value);
        }}
      />
      {selectedValue && <div className="text-sm text-gray-600">Selected: {JSON.stringify(selectedValue, null, 2)}</div>}
    </div>
  );
};

export const Default: Story = {
  render: (args: React.ComponentProps<typeof EmojiPicker>) => <EmojiPickerWithState {...args} />,
  args: {
    label: "😊 Pick an emoji or icon",
    defaultOpen: EmojiIconPickerTypes.EMOJI,
    closeOnSelect: true,
    searchPlaceholder: "Search emojis...",
    iconType: "lucide",
  },
};
