import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmojiPicker } from "./emoji-picker";
import { EmojiIconPickerTypes, TChangeHandlerProps } from "./helper";

const meta = {
  title: "Components/Emoji/EmojiPicker",
  component: EmojiPicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EmojiPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState<TChangeHandlerProps | null>(null);

    return (
      <div className="space-y-4 p-4">
        <EmojiPicker
          isOpen={isOpen}
          handleToggle={setIsOpen}
          onChange={setSelectedValue}
          label="😊 Pick an emoji or icon"
          defaultOpen={EmojiIconPickerTypes.EMOJI}
          closeOnSelect
        />
        {selectedValue && (
          <div className="text-sm p-4 bg-custom-background-80 rounded border border-custom-border-200">
            <div className="font-medium mb-2">Selected:</div>
            <pre className="text-xs">{JSON.stringify(selectedValue, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  },
};

export const OpenToEmojiTab: Story = {
  render() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState<TChangeHandlerProps | null>(null);

    return (
      <div className="space-y-4 p-4">
        <EmojiPicker
          isOpen={isOpen}
          handleToggle={setIsOpen}
          onChange={setSelectedValue}
          label="😊 Choose Emoji"
          defaultOpen={EmojiIconPickerTypes.EMOJI}
          closeOnSelect
        />
        {selectedValue && (
          <div className="text-sm">Selected: {selectedValue.type === "emoji" ? selectedValue.value : "Icon"}</div>
        )}
      </div>
    );
  },
};

export const OpenToIconTab: Story = {
  render() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState<TChangeHandlerProps | null>(null);

    return (
      <div className="space-y-4 p-4">
        <EmojiPicker
          isOpen={isOpen}
          handleToggle={setIsOpen}
          onChange={setSelectedValue}
          label="🎨 Choose Icon"
          defaultOpen={EmojiIconPickerTypes.ICON}
          closeOnSelect
        />
        {selectedValue && (
          <div className="text-sm">
            Selected:{" "}
            {selectedValue.type === "icon" && typeof selectedValue.value === "object"
              ? selectedValue.value.name
              : "Emoji"}
          </div>
        )}
      </div>
    );
  },
};

export const LucideIcons: Story = {
  render() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState<TChangeHandlerProps | null>(null);

    return (
      <div className="space-y-4 p-4">
        <EmojiPicker
          isOpen={isOpen}
          handleToggle={setIsOpen}
          onChange={setSelectedValue}
          label="Lucide Icons"
          defaultOpen={EmojiIconPickerTypes.ICON}
          closeOnSelect
          iconType="lucide"
        />
        {selectedValue && (
          <div className="text-sm p-4 bg-custom-background-80 rounded border border-custom-border-200">
            <div className="font-medium mb-2">Selected Icon:</div>
            <pre className="text-xs">{JSON.stringify(selectedValue, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  },
};

export const MaterialIcons: Story = {
  render() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState<TChangeHandlerProps | null>(null);

    return (
      <div className="space-y-4 p-4">
        <EmojiPicker
          isOpen={isOpen}
          handleToggle={setIsOpen}
          onChange={setSelectedValue}
          label="Material Icons"
          defaultOpen={EmojiIconPickerTypes.ICON}
          closeOnSelect
          iconType="material"
        />
        {selectedValue && (
          <div className="text-sm p-4 bg-custom-background-80 rounded border border-custom-border-200">
            <div className="font-medium mb-2">Selected Icon:</div>
            <pre className="text-xs">{JSON.stringify(selectedValue, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  },
};

export const CloseOnSelectDisabled: Story = {
  render() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValues, setSelectedValues] = useState<TChangeHandlerProps[]>([]);

    const handleChange = (value: TChangeHandlerProps) => {
      setSelectedValues((prev) => [...prev, value]);
    };

    return (
      <div className="space-y-4 p-4">
        <div className="flex gap-2 items-center">
          <EmojiPicker
            isOpen={isOpen}
            handleToggle={setIsOpen}
            onChange={handleChange}
            label="Select Multiple (Stays Open)"
            defaultOpen={EmojiIconPickerTypes.EMOJI}
            closeOnSelect={false}
          />
          <button
            className="px-3 py-1.5 text-sm bg-custom-background-80 rounded hover:bg-custom-background-90"
            onClick={() => setSelectedValues([])}
          >
            Clear
          </button>
        </div>
        {selectedValues.length > 0 && (
          <div className="text-sm p-4 bg-custom-background-80 rounded border border-custom-border-200">
            <div className="font-medium mb-2">Selected ({selectedValues.length}):</div>
            <div className="flex gap-2 flex-wrap">
              {selectedValues.map((val, idx) => (
                <span key={idx} className="text-lg">
                  {val.type === "emoji" ? val.value : "🎨"}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
};

export const CustomSearchPlaceholder: Story = {
  render() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState<TChangeHandlerProps | null>(null);

    return (
      <div className="space-y-4 p-4">
        <EmojiPicker
          isOpen={isOpen}
          handleToggle={setIsOpen}
          onChange={setSelectedValue}
          label="Custom Search"
          defaultOpen={EmojiIconPickerTypes.EMOJI}
          closeOnSelect
          searchPlaceholder="Type to find emojis..."
        />
        {selectedValue && <div className="text-sm">Selected: {JSON.stringify(selectedValue)}</div>}
      </div>
    );
  },
};

export const SearchDisabled: Story = {
  render() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState<TChangeHandlerProps | null>(null);

    return (
      <div className="space-y-4 p-4">
        <EmojiPicker
          isOpen={isOpen}
          handleToggle={setIsOpen}
          onChange={setSelectedValue}
          label="No Search"
          defaultOpen={EmojiIconPickerTypes.EMOJI}
          closeOnSelect
          searchDisabled
        />
        {selectedValue && <div className="text-sm">Selected: {JSON.stringify(selectedValue)}</div>}
      </div>
    );
  },
};

export const CustomIconColor: Story = {
  render() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState<TChangeHandlerProps | null>(null);

    return (
      <div className="space-y-4 p-4">
        <EmojiPicker
          isOpen={isOpen}
          handleToggle={setIsOpen}
          onChange={setSelectedValue}
          label="Custom Icon Color"
          defaultOpen={EmojiIconPickerTypes.ICON}
          closeOnSelect
          defaultIconColor="#FF5733"
        />
        {selectedValue && (
          <div className="text-sm p-4 bg-custom-background-80 rounded border border-custom-border-200">
            <pre className="text-xs">{JSON.stringify(selectedValue, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  },
};

export const DifferentPlacements: Story = {
  render() {
    const [isOpen1, setIsOpen1] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const [isOpen3, setIsOpen3] = useState(false);
    const [isOpen4, setIsOpen4] = useState(false);

    return (
      <div className="p-8 space-y-8">
        <div className="flex gap-4 items-center">
          <span className="text-sm w-32">Bottom Start:</span>
          <EmojiPicker
            isOpen={isOpen1}
            handleToggle={setIsOpen1}
            onChange={() => {}}
            label="Bottom Start"
            placement="bottom-start"
          />
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-sm w-32">Bottom End:</span>
          <EmojiPicker
            isOpen={isOpen2}
            handleToggle={setIsOpen2}
            onChange={() => {}}
            label="Bottom End"
            placement="bottom-end"
          />
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-sm w-32">Top Start:</span>
          <EmojiPicker
            isOpen={isOpen3}
            handleToggle={setIsOpen3}
            onChange={() => {}}
            label="Top Start"
            placement="top-start"
          />
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-sm w-32">Top End:</span>
          <EmojiPicker
            isOpen={isOpen4}
            handleToggle={setIsOpen4}
            onChange={() => {}}
            label="Top End"
            placement="top-end"
          />
        </div>
      </div>
    );
  },
};

export const InFormContext: Story = {
  render() {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
      title: "",
      emoji: null as TChangeHandlerProps | null,
    });

    const handleEmojiChange = (value: TChangeHandlerProps) => {
      setFormData((prev) => ({ ...prev, emoji: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      alert(`Form submitted:\n${JSON.stringify(formData, null, 2)}`);
    };

    return (
      <div className="max-w-md p-4">
        <form onSubmit={handleSubmit} className="space-y-4 p-6 border border-custom-border-200 rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-2">Project Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-custom-background-80 border border-custom-border-200 rounded"
              placeholder="Enter project title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Project Icon</label>
            <EmojiPicker
              isOpen={isOpen}
              handleToggle={setIsOpen}
              onChange={handleEmojiChange}
              label={formData.emoji && formData.emoji.type === "emoji" ? formData.emoji.value : "Click to select icon"}
              defaultOpen={EmojiIconPickerTypes.EMOJI}
              closeOnSelect
              buttonClassName="px-4 py-2 bg-custom-background-80 border border-custom-border-200 rounded hover:bg-custom-background-90 w-full text-left"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-custom-primary-100 text-white rounded hover:bg-custom-primary-200"
          >
            Create Project
          </button>
        </form>
      </div>
    );
  },
};
