/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import preview from "#.storybook/preview";
import { ChevronsUpDown } from "lucide-react";
import { useArgs, useState } from "storybook/preview-api";
import { expect, fn, screen, waitFor } from "storybook/test";
import { CheckIcon, StatePropertyIcon } from "../icons";
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

const meta = preview.meta({
  title: "Overlays/Combobox",
  component: Combobox,
  subcomponents: {
    ComboboxButton: Combobox.Button,
    ComboboxOptions: Combobox.Options,
    ComboboxOption: Combobox.Option,
  },
  parameters: {
    layout: "centered",
  },
  args: {
    children: null,
    value: "",
    onValueChange: fn(),
  },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<typeof args>();
    return (
      <Combobox {...args} value={value} onValueChange={(v) => updateArgs({ value: v as string })}>
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
});

export const Default = meta.story({
  async play({ canvas, userEvent }) {
    const trigger = canvas.getByRole("combobox");
    await expect(trigger).toBeVisible();
    await userEvent.click(trigger);
    await waitFor(() => expect(screen.getByText("React")).toBeVisible());
    await expect(screen.getByText("Vue")).toBeVisible();
    await expect(screen.getByText("Angular")).toBeVisible();
  },
});

export const WithoutSearch = meta.story({
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<typeof args>();
    return (
      <Combobox {...args} value={value} onValueChange={(v) => updateArgs({ value: v as string })}>
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
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("combobox"));
    await waitFor(() => expect(screen.getByText("React")).toBeVisible());
  },
});

export const MultiSelect = meta.story({
  args: { value: [] as unknown as string, multiSelect: true },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<typeof args>();
    return (
      <Combobox {...args} value={value} onValueChange={(v) => updateArgs({ value: v as string[] })}>
        <Combobox.Button className="flex w-72 items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
          <span className="truncate">
            {Array.isArray(value) && value.length > 0 ? `${value.length} selected` : "Select frameworks..."}
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
              {Array.isArray(value) && value.includes(framework.value) && <CheckIcon className="h-4 w-4" />}
              <span>{framework.label}</span>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("combobox"));
    await waitFor(() => expect(screen.getByText("React")).toBeVisible());
  },
});

export const MultiSelectWithLimit = meta.story({
  args: { value: [] as unknown as string, multiSelect: true, maxSelections: 3 },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<typeof args>();
    return (
      <Combobox {...args} value={value} onValueChange={(v) => updateArgs({ value: v as string[] })}>
        <Combobox.Button className="flex w-72 items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
          <span className="truncate">
            {Array.isArray(value) && value.length > 0 ? `${value.length}/3 selected` : "Select up to 3 frameworks..."}
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
              {Array.isArray(value) && value.includes(framework.value) && <CheckIcon className="h-4 w-4" />}
              <span>{framework.label}</span>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("combobox"));
    await waitFor(() => expect(screen.getByText("React")).toBeVisible());
  },
});

export const MultiSelectWithChips = meta.story({
  render: function Render() {
    const [value, setValue] = useState<string[]>([]);

    return (
      <Combobox multiSelect value={value} onValueChange={(v) => setValue(v as string[])}>
        <Combobox.Chips
          className="w-72 border-subtle bg-white rounded-md px-2 py-1 hover:bg-surface-1"
          getLabel={(val) => frameworks.find((f) => f.value === val)?.label || val}
        >
          <span className="text-13 text-placeholder">Select frameworks...</span>
        </Combobox.Chips>
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
});

export const MultiSelectWithCustomChips = meta.story({
  render: function Render() {
    const [value, setValue] = useState<string[]>([]);

    return (
      <Combobox multiSelect value={value} onValueChange={(v) => setValue(v as string[])}>
        <Combobox.Chips
          className="w-72 border-subtle bg-white rounded-md px-2 py-1 hover:bg-surface-1"
          getLabel={(val) => frameworks.find((f) => f.value === val)?.label || val}
          renderChip={(chipValue, label, Chip) => (
            <Chip value={chipValue} className="bg-surface-1">
              <StatePropertyIcon className="size-3 text-secondary" />
              <span className="text-caption-md-regular">{label}</span>
            </Chip>
          )}
        >
          <span className="text-13 text-placeholder">Select frameworks...</span>
        </Combobox.Chips>
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
});

export const Disabled = meta.story({
  args: { disabled: true },
  render(args) {
    return (
      <Combobox {...args}>
        <Combobox.Button className="flex w-72 items-center justify-between rounded-md border border-gray-300 bg-gray-100 px-4 py-2 opacity-50">
          <span>Select framework...</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Combobox.Button>
        <Combobox.Options showSearch searchPlaceholder="Search framework..." className="w-72">
          {frameworks.map((framework) => (
            <Combobox.Option
              key={framework.value}
              value={framework.value}
              className="flex items-center gap-2 px-4 py-2"
            >
              <span>{framework.label}</span>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    );
  },
});

export const DisabledOptions = meta.story({
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<typeof args>();
    return (
      <Combobox {...args} value={value} onValueChange={(v) => updateArgs({ value: v as string })}>
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
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("combobox"));
    await waitFor(() => expect(screen.getByText("React")).toBeVisible());
    await expect(screen.getByText("Angular")).toBeVisible();
  },
});

export const CustomEmptyMessage = meta.story({
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<typeof args>();
    return (
      <Combobox {...args} value={value} onValueChange={(v) => updateArgs({ value: v as string })}>
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
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("combobox"));
    await waitFor(() => expect(screen.getByText("React")).toBeVisible());
  },
});

export const MaxHeightMedium = meta.story({
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<typeof args>();
    return (
      <Combobox {...args} value={value} onValueChange={(v) => updateArgs({ value: v as string })}>
        <Combobox.Button className="flex w-72 items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
          <span>{value ? frameworks.find((f) => f.value === value)?.label : "Select framework..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Combobox.Button>
        <Combobox.Options showSearch searchPlaceholder="Search..." maxHeight="md" className="w-72">
          {frameworks.map((framework) => (
            <Combobox.Option key={framework.value} value={framework.value} className="px-4 py-2">
              <span>{framework.label}</span>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("combobox"));
    await waitFor(() => expect(screen.getByText("React")).toBeVisible());
  },
});

export const WithCustomClassNames = meta.story({
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<typeof args>();
    return (
      <Combobox {...args} value={value} onValueChange={(v) => updateArgs({ value: v as string })}>
        <Combobox.Button className="flex w-72 items-center justify-between rounded-md border-2 border-blue-300 bg-blue-50 px-4 py-2 hover:bg-blue-100">
          <span>{value ? frameworks.find((f) => f.value === value)?.label : "Select framework..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Combobox.Button>
        <Combobox.Options
          showSearch
          searchPlaceholder="Search..."
          className="w-72"
          inputClassName="bg-blue-50 border-blue-200"
          optionsContainerClassName="bg-blue-50"
          positionerClassName="z-50"
        >
          {frameworks.map((framework) => (
            <Combobox.Option key={framework.value} value={framework.value} className="px-4 py-2">
              <span>{framework.label}</span>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("combobox"));
    await waitFor(() => expect(screen.getByText("React")).toBeVisible());
  },
});

export const WithDefaultValue = meta.story({
  args: { value: "react" },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("combobox"));
    await waitFor(() => expect(screen.getByText("Vue")).toBeVisible());
  },
});

export const SearchFiltering = meta.story({
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<typeof args>();
    return (
      <Combobox {...args} value={value} onValueChange={(v) => updateArgs({ value: v as string })}>
        <Combobox.Button className="flex w-72 items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
          <span>{value ? frameworks.find((f) => f.value === value)?.label : "Select..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Combobox.Button>
        <Combobox.Options showSearch searchPlaceholder="Type to filter..." className="w-72">
          {frameworks.map((framework) => (
            <Combobox.Option key={framework.value} value={framework.value} className="px-4 py-2">
              <span>{framework.label}</span>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("combobox"));
    await waitFor(() => expect(screen.getByText("React")).toBeVisible());
    await userEvent.type(screen.getByPlaceholderText("Type to filter..."), "rea");
    await waitFor(() => expect(screen.getByText("React")).toBeVisible());
  },
});

export const SearchNoResults = meta.story({
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<typeof args>();
    return (
      <Combobox {...args} value={value} onValueChange={(v) => updateArgs({ value: v as string })}>
        <Combobox.Button className="flex w-72 items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
          <span>Select...</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Combobox.Button>
        <Combobox.Options showSearch searchPlaceholder="Search..." emptyMessage="Nothing found!" className="w-72">
          {frameworks.map((framework) => (
            <Combobox.Option key={framework.value} value={framework.value} className="px-4 py-2">
              <span>{framework.label}</span>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("combobox"));
    await waitFor(() => expect(screen.getByText("React")).toBeVisible());
    await userEvent.type(screen.getByPlaceholderText("Search..."), "zzzznotfound");
    await waitFor(() => expect(screen.getByText("Nothing found!")).toBeVisible());
  },
});

export const WithNestedContent = meta.story({
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<typeof args>();
    return (
      <Combobox {...args} value={value} onValueChange={(v) => updateArgs({ value: v as string })}>
        <Combobox.Button className="flex w-72 items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
          <span>Select...</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Combobox.Button>
        <Combobox.Options showSearch searchPlaceholder="Search..." className="w-72">
          <Combobox.Option value="react" className="px-4 py-2">
            <div className="flex gap-2">
              <span>React</span>
              <span className="text-gray-400">{42}</span>
            </div>
          </Combobox.Option>
          <Combobox.Option value="vue" className="px-4 py-2">
            <div className="flex gap-2">
              <span>Vue</span>
            </div>
          </Combobox.Option>
          <div className="px-2 py-1 text-11 text-gray-400">Extra content</div>
        </Combobox.Options>
      </Combobox>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("combobox"));
    await waitFor(() => expect(screen.getByText("React")).toBeVisible());
    // Search for "rea" to exercise getTextContent with nested children
    await userEvent.type(screen.getByPlaceholderText("Search..."), "rea");
    await waitFor(() => expect(screen.getByText("React")).toBeVisible());
  },
});

export const DisabledButton = meta.story({
  args: { disabled: true },
  render(args) {
    return (
      <Combobox {...args}>
        <Combobox.Button
          disabled
          className="flex w-72 items-center justify-between rounded-md border border-gray-300 bg-gray-100 px-4 py-2 opacity-50"
        >
          <span>Disabled button</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Combobox.Button>
        <Combobox.Options className="w-72">
          <Combobox.Option value="react" className="px-4 py-2">
            React
          </Combobox.Option>
        </Combobox.Options>
      </Combobox>
    );
  },
});
