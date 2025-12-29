import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronsUpDown } from "lucide-react";
import { useArgs } from "storybook/preview-api";
import { CheckIcon } from "../icons";
import { Combobox } from "./combobox";

const frameworks = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
  { value: "solid", label: "Solid" },
  { value: "next", label: "Next.js" },
  { value: "nuxt", label: "Nuxt" },
  { value: "remix", label: "Remix" },
];

const meta = {
  title: "Components/Combobox",
  component: Combobox,
  subcomponents: {
    ComboboxButton: Combobox.Button,
    ComboboxOptions: Combobox.Options,
    ComboboxOption: Combobox.Option,
  },
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: null,
    value: "",
    onValueChange: () => {},
  },
  render(args) {
    const [{ value }, updateArgs] = useArgs();
    const setValue = (newValue: string | string[]) => updateArgs({ value: newValue });
    return (
      <Combobox {...args} value={value} onValueChange={(v) => setValue(v as string)}>
        <Combobox.Button className="flex w-72 items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
          <span>{value ? frameworks.find((f) => f.value === value)?.label : "Select framework..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Combobox.Button>
        <Combobox.Options showSearch searchPlaceholder="Search framework..." className="w-72">
          {frameworks.map((framework) => (
            <Combobox.Option
              key={framework.value}
              value={framework.value}
              className="flex items-center gap-2 px-4 py-2"
            >
              {value === framework.value && <CheckIcon className="h-4 w-4" />}
              <span>{framework.label}</span>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    );
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutSearch: Story = {
  render() {
    const [value, setValue] = useState("");
    return (
      <Combobox value={value} onValueChange={(v) => setValue(v as string)}>
        <Combobox.Button className="flex w-72 items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
          <span>{value ? frameworks.find((f) => f.value === value)?.label : "Select framework..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Combobox.Button>
        <Combobox.Options className="w-72">
          {frameworks.map((framework) => (
            <Combobox.Option
              key={framework.value}
              value={framework.value}
              className="flex items-center gap-2 px-4 py-2"
            >
              {value === framework.value && <CheckIcon className="h-4 w-4" />}
              <span>{framework.label}</span>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    );
  },
};

export const MultiSelect: Story = {
  render() {
    const [value, setValue] = useState<string[]>([]);

    return (
      <Combobox multiSelect value={value} onValueChange={(v) => setValue(v as string[])}>
        <Combobox.Button className="flex w-72 items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
          <span className="truncate">{value.length > 0 ? `${value.length} selected` : "Select frameworks..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Combobox.Button>
        <Combobox.Options showSearch searchPlaceholder="Search framework..." className="w-72">
          {frameworks.map((framework) => (
            <Combobox.Option
              key={framework.value}
              value={framework.value}
              className="flex items-center gap-2 px-4 py-2"
            >
              {value.includes(framework.value) && <CheckIcon className="h-4 w-4" />}
              <span>{framework.label}</span>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    );
  },
};

export const MultiSelectWithLimit: Story = {
  render() {
    const [value, setValue] = useState<string[]>([]);

    return (
      <div className="space-y-2">
        <Combobox multiSelect maxSelections={3} value={value} onValueChange={(v) => setValue(v as string[])}>
          <Combobox.Button className="flex w-72 items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
            <span className="truncate">
              {value.length > 0 ? `${value.length}/3 selected` : "Select up to 3 frameworks..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Combobox.Button>
          <Combobox.Options showSearch searchPlaceholder="Search framework..." className="w-72">
            {frameworks.map((framework) => (
              <Combobox.Option
                key={framework.value}
                value={framework.value}
                className="flex items-center gap-2 px-4 py-2"
              >
                {value.includes(framework.value) && <CheckIcon className="h-4 w-4" />}
                <span>{framework.label}</span>
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </Combobox>
        <p className="text-11 text-gray-500">Maximum 3 selections allowed</p>
      </div>
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  render() {
    const [value, setValue] = useState("");
    return (
      <Combobox disabled value={value} onValueChange={(v) => setValue(v as string)}>
        <Combobox.Button className="flex w-72 items-center justify-between rounded-md border border-gray-300 bg-gray-100 px-4 py-2 opacity-50">
          <span>{value ? frameworks.find((f) => f.value === value)?.label : "Select framework..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Combobox.Button>
        <Combobox.Options showSearch searchPlaceholder="Search framework..." className="w-72">
          {frameworks.map((framework) => (
            <Combobox.Option
              key={framework.value}
              value={framework.value}
              className="flex items-center gap-2 px-4 py-2"
            >
              {value === framework.value && <CheckIcon className="h-4 w-4" />}
              <span>{framework.label}</span>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    );
  },
};

export const DisabledOptions: Story = {
  render() {
    const [value, setValue] = useState("");
    return (
      <Combobox value={value} onValueChange={(v) => setValue(v as string)}>
        <Combobox.Button className="flex w-72 items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
          <span>{value ? frameworks.find((f) => f.value === value)?.label : "Select framework..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Combobox.Button>
        <Combobox.Options showSearch searchPlaceholder="Search framework..." className="w-72">
          {frameworks.map((framework) => (
            <Combobox.Option
              key={framework.value}
              value={framework.value}
              disabled={framework.value === "angular" || framework.value === "svelte"}
              className="flex items-center gap-2 px-4 py-2"
            >
              {value === framework.value && <CheckIcon className="h-4 w-4" />}
              <span>{framework.label}</span>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    );
  },
};

export const CustomMaxHeight: Story = {
  render() {
    const [value, setValue] = useState("");
    return (
      <Combobox value={value} onValueChange={(v) => setValue(v as string)}>
        <Combobox.Button className="flex w-72 items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
          <span>{value ? frameworks.find((f) => f.value === value)?.label : "Select framework..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Combobox.Button>
        <Combobox.Options showSearch searchPlaceholder="Search framework..." maxHeight="sm" className="w-72">
          {frameworks.map((framework) => (
            <Combobox.Option
              key={framework.value}
              value={framework.value}
              className="flex items-center gap-2 px-4 py-2"
            >
              {value === framework.value && <CheckIcon className="h-4 w-4" />}
              <span>{framework.label}</span>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    );
  },
};

export const CustomEmptyMessage: Story = {
  render() {
    const [value, setValue] = useState("");
    return (
      <Combobox value={value} onValueChange={(v) => setValue(v as string)}>
        <Combobox.Button className="flex w-72 items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
          <span>{value ? frameworks.find((f) => f.value === value)?.label : "Select framework..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Combobox.Button>
        <Combobox.Options
          showSearch
          searchPlaceholder="Search framework..."
          emptyMessage="No frameworks found. Try a different search."
          className="w-72"
        >
          {frameworks.map((framework) => (
            <Combobox.Option
              key={framework.value}
              value={framework.value}
              className="flex items-center gap-2 px-4 py-2"
            >
              {value === framework.value && <CheckIcon className="h-4 w-4" />}
              <span>{framework.label}</span>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    );
  },
};
