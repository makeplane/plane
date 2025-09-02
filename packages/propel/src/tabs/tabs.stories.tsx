import { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs } from "./tabs";

type TabOption = {
  label: string;
  value: string;
};

const tabOptions: TabOption[] = [
  { label: "Account", value: "account" },
  { label: "Password", value: "password" },
];

interface StoryProps extends ComponentProps<typeof Tabs> {
  options: TabOption[];
}

const meta: Meta<StoryProps> = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
  args: {
    defaultValue: "account",
    options: tabOptions,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    options: [
      {
        label: "Account",
        value: "account",
      },
      {
        label: "Password",
        value: "password",
      },
    ],
  },

  render: ({ defaultValue, options }) => {
    const safeDefault = options?.some((o) => o.value === defaultValue) ? defaultValue : options?.[0]?.value;
    return (
      <div className="w-[400px]">
        <Tabs defaultValue={safeDefault}>
          <Tabs.List>
            {options.map((option) => (
              <Tabs.Trigger key={option.value} value={option.value}>
                {option.label}
              </Tabs.Trigger>
            ))}
            <Tabs.Indicator />
          </Tabs.List>
          {options.map((option) => (
            <Tabs.Content key={option.value} value={option.value} className="p-4">
              {option.label} content goes here
            </Tabs.Content>
          ))}
        </Tabs>
      </div>
    );
  },
};

export const Sizes: Story = {
  render: ({ defaultValue, options }) => {
    const sizes = ["sm", "md", "lg"] as const;
    const sizeLabels: Record<(typeof sizes)[number], string> = {
      sm: "Small",
      md: "Medium",
      lg: "Large",
    };
    return (
      <div className="w-[400px] grid gap-4">
        {sizes.map((size) => (
          <div key={size} className="flex flex-col gap-2">
            <div className="text-lg">{sizeLabels[size]}</div>
            <Tabs defaultValue={defaultValue}>
              <Tabs.List>
                {options.map((option) => (
                  <Tabs.Trigger key={option.value} value={option.value} size={size}>
                    {option.label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </Tabs>
          </div>
        ))}
      </div>
    );
  },
};
