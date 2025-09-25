import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SmilePlus } from "lucide-react";
import { stringToEmoji } from "../emoji-icon-picker";
import { EmojiReactionPicker } from "./emoji-reaction-picker";

const meta: Meta<typeof EmojiReactionPicker> = {
  title: "Components/Emoji/EmojiReactionPicker",
  component: EmojiReactionPicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EmojiReactionPicker>;

const EmojiPickerDemo = (args: React.ComponentProps<typeof EmojiReactionPicker>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  return (
    <div className="space-y-4 p-4">
      <EmojiReactionPicker
        {...args}
        isOpen={isOpen}
        handleToggle={setIsOpen}
        onChange={(emoji) => {
          setSelectedEmoji(emoji);
          console.log("Selected emoji:", emoji);
        }}
        label={
          <span className={`flex items-center justify-center rounded-md px-2 size-8 text-xl`}>
            {selectedEmoji ? stringToEmoji(selectedEmoji) : <SmilePlus className="h-6 text-custom-text-100" />}
          </span>
        }
      />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <EmojiPickerDemo {...args} />,
  args: {
    closeOnSelect: true,
    searchPlaceholder: "Search emojis...",
  },
};
