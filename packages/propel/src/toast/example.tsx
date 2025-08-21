import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { Combobox } from "./combobox";

// Sample data
const countries = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "uk", label: "United Kingdom" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "jp", label: "Japan" },
  { value: "in", label: "India" },
];

const meta: Meta<typeof Combobox> = {
  title: "Components/Combobox",
  component: Combobox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Combobox>;

// Default single select combobox
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<string>("");

    const handleValueChange = (newValue: string | string[]) => {
      if (typeof newValue === "string") {
        setValue(newValue);
      }
    };

    return (
      <div className="w-80">
        <Combobox value={value} onValueChange={handleValueChange}>
          <Combobox.Button className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            {value ? countries.find((country) => country.value === value)?.label : "Select a country..."}
            <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Combobox.Button>
          <Combobox.Options
            showSearch
            searchPlaceholder="Search countries..."
            className="my-1 rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none min-w-48 whitespace-nowrap z-30"
            inputClassName="placeholder:text-muted-foreground flex rounded-md outline-hidden disabled:cursor-not-allowed disabled:opacity-50 w-full bg-transparent py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none border-none focus:ring-0"
            optionsContainerClassName="mt-2 scroll-py-1 overflow-x-hidden overflow-y-auto [&_[cmdk-list-sizer]>[cmdk-item]:not(:first-child)]:mt-1"
          >
            {countries.map((country) => (
              <Combobox.Option
                key={country.value}
                value={country.value}
                className="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
              >
                {country.label}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </Combobox>
      </div>
    );
  },
};

// Multi-select combobox
export const MultiSelect: Story = {
  render: () => {
    const [value, setValue] = React.useState<string[]>([]);

    const handleValueChange = (newValue: string | string[]) => {
      if (Array.isArray(newValue)) {
        setValue(newValue);
      }
    };

    return (
      <div className="w-80">
        <Combobox value={value} onValueChange={handleValueChange} multiSelect>
          <Combobox.Button className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <div className="flex flex-wrap gap-1">
              {value.length > 0 ? (
                value.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                  >
                    {countries.find((country) => country.value === v)?.label}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setValue(value.filter((item) => item !== v));
                      }}
                      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground">Select countries...</span>
              )}
            </div>
            <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Combobox.Button>
          <Combobox.Options
            showSearch
            searchPlaceholder="Search countries..."
            className="my-1 rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none min-w-48 whitespace-nowrap z-30"
            inputClassName="placeholder:text-muted-foreground flex rounded-md outline-hidden disabled:cursor-not-allowed disabled:opacity-50 w-full bg-transparent py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none border-none focus:ring-0"
            optionsContainerClassName="mt-2 scroll-py-1 overflow-x-hidden overflow-y-auto [&_[cmdk-list-sizer]>[cmdk-item]:not(:first-child)]:mt-1"
          >
            {countries.map((country) => (
              <Combobox.Option
                key={country.value}
                value={country.value}
                className="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
              >
                {country.label}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </Combobox>
      </div>
    );
  },
};
