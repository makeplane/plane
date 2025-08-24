import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs } from "./tabs";
import { Fragment } from "react";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <div className="w-[400px]">
      <Tabs defaultValue="account">
        <Tabs.List>
          <Tabs.Trigger value="account">Overview</Tabs.Trigger>
          <Tabs.Trigger value="password">Settings</Tabs.Trigger>
          <Tabs.Indicator />
        </Tabs.List>
        <Tabs.Content value="account" className="p-4">
          Overview settings go here
        </Tabs.Content>
        <Tabs.Content value="password" className="p-4">
          Settings settings go here
        </Tabs.Content>
      </Tabs>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => {
    const sizes = ["sm", "md", "lg"] as const;
    const labels = {
      sm: "Small",
      md: "Medium",
      lg: "Large",
    };

    return (
      <div className="w-[400px]">
        {sizes.map((size, index) => (
          <Fragment key={size}>
            {index > 0 && <div className="h-4" />}
            <div className="text-lg">{labels[size]}</div>
            <Tabs defaultValue="overview">
              <Tabs.List>
                <Tabs.Trigger value="overview" size={size}>
                  Overview
                </Tabs.Trigger>
                <Tabs.Trigger value="settings" size={size}>
                  Settings
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs>
          </Fragment>
        ))}
      </div>
    );
  },
};
