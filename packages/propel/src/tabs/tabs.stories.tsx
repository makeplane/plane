import { Fragment } from "react";
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

interface StoryProps extends React.ComponentProps<typeof Tabs> {
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

  render: ({ defaultValue, options }) => (
    <div className="w-[400px]">
      <Tabs defaultValue={defaultValue}>
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
  ),
};

export const Sizes: Story = {
  render: ({ defaultValue, options }) => {
    const sizes = ["sm", "md", "lg"] as const;
    return (
      <div className="w-[400px]">
        {sizes.map((size) => (
          <Fragment key={size}>
            <div className="text-lg">{size}</div>
            <Tabs defaultValue={defaultValue}>
              <Tabs.List>
                {options.map((option) => (
                  <Tabs.Trigger key={option.value} value={option.value} size={size}>
                    {option.label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </Tabs>
          </Fragment>
        ))}
      </div>
    );
  },
};
