import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SmilePlus } from "lucide-react";
import { stringToEmoji } from "../emoji-icon-picker";
import type { EmojiReactionType } from "./emoji-reaction";
import { EmojiReactionGroup } from "./emoji-reaction";
import { EmojiReactionPicker } from "./emoji-reaction-picker";

const meta = {
  title: "Components/Emoji/EmojiReactionPicker",
  component: EmojiReactionPicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EmojiReactionPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: false,
    handleToggle: () => {},
    onChange: () => {},
    label: "Pick Emoji",
  },
  render() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

    return (
      <div className="space-y-4 p-4">
        <EmojiReactionPicker
          isOpen={isOpen}
          handleToggle={setIsOpen}
          onChange={setSelectedEmoji}
          closeOnSelect
          label={
            <span className="flex items-center justify-center rounded-md px-2 size-8 text-18">
              {selectedEmoji ? stringToEmoji(selectedEmoji) : <SmilePlus className="h-6 text-primary" />}
            </span>
          }
        />
        {selectedEmoji && (
          <div className="text-13 p-4 bg-layer-1 rounded-sm border border-subtle">Selected: {selectedEmoji}</div>
        )}
      </div>
    );
  },
};

export const WithCustomLabel: Story = {
  args: {
    isOpen: false,
    handleToggle: () => {},
    onChange: () => {},
    label: "Add Reaction",
  },
  render() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

    return (
      <div className="space-y-4 p-4">
        <EmojiReactionPicker
          isOpen={isOpen}
          handleToggle={setIsOpen}
          onChange={setSelectedEmoji}
          closeOnSelect
          label={
            <button className="px-4 py-2 bg-layer-1 border border-subtle rounded-sm hover:bg-surface-2 flex items-center gap-2">
              {selectedEmoji ? stringToEmoji(selectedEmoji) : <SmilePlus className="h-4 w-4" />}
              <span className="text-13">Add Reaction</span>
            </button>
          }
        />
        {selectedEmoji && <div className="text-13">Selected: {selectedEmoji}</div>}
      </div>
    );
  },
};

export const InlineReactions: Story = {
  args: {
    isOpen: false,
    handleToggle: () => {},
    onChange: () => {},
    label: "Add",
  },
  render() {
    const [isOpen, setIsOpen] = useState(false);
    const [reactions, setReactions] = useState<EmojiReactionType[]>([
      { emoji: "👍", count: 3, reacted: false, users: ["Alice", "Bob", "Charlie"] },
      { emoji: "❤️", count: 2, reacted: true, users: ["You", "David"] },
    ]);

    const handleReactionAdd = (emoji: string) => {
      setReactions((prev) => {
        const existing = prev.find((r) => r.emoji === emoji);
        if (existing) {
          return prev.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r));
        }
        return [...prev, { emoji, count: 1, reacted: true, users: ["You"] }];
      });
    };

    const handleReactionClick = (emoji: string) => {
      setReactions((prev) =>
        prev.map((r) => {
          if (r.emoji === emoji) {
            return {
              ...r,
              reacted: !r.reacted,
              count: r.reacted ? r.count - 1 : r.count + 1,
            };
          }
          return r;
        })
      );
    };

    return (
      <div className="p-4">
        <EmojiReactionGroup
          reactions={reactions}
          onReactionClick={handleReactionClick}
          onAddReaction={() => setIsOpen(true)}
          showAddButton={false}
        />
        <EmojiReactionPicker
          isOpen={isOpen}
          handleToggle={setIsOpen}
          onChange={handleReactionAdd}
          closeOnSelect
          label={
            <button className="inline-flex items-center justify-center rounded-full border border-dashed border-strong bg-surface-1 text-placeholder transition-all duration-200 hover:border-accent-strong hover:text-accent-primary hover:bg-accent-primary/5 h-7 w-7">
              <SmilePlus className="h-3.5 w-3.5" />
            </button>
          }
        />
      </div>
    );
  },
};

export const DifferentPlacements: Story = {
  args: {
    isOpen: false,
    handleToggle: () => {},
    onChange: () => {},
    label: "Placements",
  },
  render() {
    const [isOpen1, setIsOpen1] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const [isOpen3, setIsOpen3] = useState(false);
    const [isOpen4, setIsOpen4] = useState(false);

    return (
      <div className="p-8 space-y-8">
        <div className="flex gap-4 items-center">
          <span className="text-13 w-32">Bottom Start:</span>
          <EmojiReactionPicker
            isOpen={isOpen1}
            handleToggle={setIsOpen1}
            onChange={() => {}}
            placement="bottom-start"
            label={<SmilePlus className="h-6 w-6" />}
          />
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-13 w-32">Bottom End:</span>
          <EmojiReactionPicker
            isOpen={isOpen2}
            handleToggle={setIsOpen2}
            onChange={() => {}}
            placement="bottom-end"
            label={<SmilePlus className="h-6 w-6" />}
          />
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-13 w-32">Top Start:</span>
          <EmojiReactionPicker
            isOpen={isOpen3}
            handleToggle={setIsOpen3}
            onChange={() => {}}
            placement="top-start"
            label={<SmilePlus className="h-6 w-6" />}
          />
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-13 w-32">Top End:</span>
          <EmojiReactionPicker
            isOpen={isOpen4}
            handleToggle={setIsOpen4}
            onChange={() => {}}
            placement="top-end"
            label={<SmilePlus className="h-6 w-6" />}
          />
        </div>
      </div>
    );
  },
};

export const SearchDisabled: Story = {
  args: {
    isOpen: false,
    handleToggle: () => {},
    onChange: () => {},
    label: "No Search",
  },
  render() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

    return (
      <div className="space-y-4 p-4">
        <EmojiReactionPicker
          isOpen={isOpen}
          handleToggle={setIsOpen}
          onChange={setSelectedEmoji}
          closeOnSelect
          searchDisabled
          label={
            <button className="px-4 py-2 bg-layer-1 border border-subtle rounded-sm hover:bg-surface-2">
              No Search
            </button>
          }
        />
        {selectedEmoji && <div className="text-13">Selected: {selectedEmoji}</div>}
      </div>
    );
  },
};

export const CustomSearchPlaceholder: Story = {
  args: {
    isOpen: false,
    handleToggle: () => {},
    onChange: () => {},
    label: "Custom Search",
  },
  render() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

    return (
      <div className="space-y-4 p-4">
        <EmojiReactionPicker
          isOpen={isOpen}
          handleToggle={setIsOpen}
          onChange={setSelectedEmoji}
          closeOnSelect
          searchPlaceholder="Find your emoji..."
          label={
            <button className="px-4 py-2 bg-layer-1 border border-subtle rounded-sm hover:bg-surface-2">
              Custom Search
            </button>
          }
        />
        {selectedEmoji && <div className="text-13">Selected: {selectedEmoji}</div>}
      </div>
    );
  },
};

export const CloseOnSelectDisabled: Story = {
  args: {
    isOpen: false,
    handleToggle: () => {},
    onChange: () => {},
    label: "Select Multiple",
  },
  render() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);

    const handleChange = (emoji: string) => {
      setSelectedEmojis((prev) => [...prev, emoji]);
    };

    return (
      <div className="space-y-4 p-4">
        <div className="flex gap-2 items-center">
          <EmojiReactionPicker
            isOpen={isOpen}
            handleToggle={setIsOpen}
            onChange={handleChange}
            closeOnSelect={false}
            label={
              <button className="px-4 py-2 bg-layer-1 border border-subtle rounded-sm hover:bg-surface-2">
                Select Multiple (Stays Open)
              </button>
            }
          />
          <button
            className="px-3 py-1.5 text-13 bg-layer-1 rounded-sm hover:bg-surface-2"
            onClick={() => setSelectedEmojis([])}
          >
            Clear
          </button>
        </div>
        {selectedEmojis.length > 0 && (
          <div className="text-13 p-4 bg-layer-1 rounded-sm border border-subtle">
            <div className="font-medium mb-2">Selected ({selectedEmojis.length}):</div>
            <div className="flex gap-2 flex-wrap">
              {selectedEmojis.map((emoji, idx) => (
                <span key={idx} className="text-18">
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
};

export const InMessageContext: Story = {
  args: {
    isOpen: false,
    handleToggle: () => {},
    onChange: () => {},
    label: "Message",
  },
  render() {
    const [isOpen, setIsOpen] = useState(false);
    const [reactions, setReactions] = useState<EmojiReactionType[]>([
      { emoji: "👍", count: 5, reacted: false, users: ["Alice", "Bob", "Charlie"] },
    ]);

    const handleReactionAdd = (emoji: string) => {
      setReactions((prev) => {
        const existing = prev.find((r) => r.emoji === emoji);
        if (existing) {
          return prev.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r));
        }
        return [...prev, { emoji, count: 1, reacted: true, users: ["You"] }];
      });
    };

    const handleReactionClick = (emoji: string) => {
      setReactions((prev) =>
        prev.map((r) => {
          if (r.emoji === emoji) {
            return {
              ...r,
              reacted: !r.reacted,
              count: r.reacted ? r.count - 1 : r.count + 1,
            };
          }
          return r;
        })
      );
    };

    return (
      <div className="max-w-md border border-subtle rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center text-on-color text-13">
            AB
          </div>
          <div className="flex-1">
            <div className="font-medium text-13">Alice Brown</div>
            <div className="text-13 text-tertiary mt-1">
              Just finished the design for the new dashboard! Would love to hear your thoughts.
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <EmojiReactionGroup reactions={reactions} onReactionClick={handleReactionClick} showAddButton={false} />
          <EmojiReactionPicker
            isOpen={isOpen}
            handleToggle={setIsOpen}
            onChange={handleReactionAdd}
            closeOnSelect
            label={
              <button className="inline-flex items-center justify-center rounded-full border border-dashed border-strong bg-surface-1 text-placeholder transition-all duration-200 hover:border-accent-strong hover:text-accent-primary hover:bg-accent-primary/5 h-7 w-7">
                <SmilePlus className="h-3.5 w-3.5" />
              </button>
            }
          />
        </div>
      </div>
    );
  },
};
