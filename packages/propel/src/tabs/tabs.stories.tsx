import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Settings, User, Bell } from "lucide-react";
import { HomeIcon } from "../icons/workspace/home-icon";
import { Tabs } from "./tabs";

type TabOption = {
  label: string;
  value: string;
};

const tabOptions: TabOption[] = [
  { label: "Account", value: "account" },
  { label: "Password", value: "password" },
  { label: "Notifications", value: "notifications" },
];

// cannot use satisfies here because base-ui does not have portable types.
const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  subcomponents: {
    TabsList: Tabs.List,
    TabsTrigger: Tabs.Trigger,
    TabsContent: Tabs.Content,
    TabsIndicator: Tabs.Indicator,
  },
  parameters: {
    layout: "centered",
  },
  args: {
    defaultValue: "account",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render({ defaultValue }) {
    return (
      <div className="w-[400px]">
        <Tabs defaultValue={defaultValue}>
          <Tabs.List>
            {tabOptions.map((option) => (
              <Tabs.Trigger key={option.value} value={option.value}>
                {option.label}
              </Tabs.Trigger>
            ))}
            <Tabs.Indicator />
          </Tabs.List>
          {tabOptions.map((option) => (
            <Tabs.Content key={option.value} value={option.value} className="p-4">
              <div className="text-13">
                <h3 className="font-medium mb-2">{option.label}</h3>
                <p className="text-tertiary">Content for the {option.label.toLowerCase()} tab.</p>
              </div>
            </Tabs.Content>
          ))}
        </Tabs>
      </div>
    );
  },
};

export const Sizes: Story = {
  render({ defaultValue }) {
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
            <div className="text-13 font-medium">{sizeLabels[size]}</div>
            <Tabs defaultValue={defaultValue}>
              <Tabs.List>
                {tabOptions.map((option) => (
                  <Tabs.Trigger key={option.value} value={option.value} size={size}>
                    {option.label}
                  </Tabs.Trigger>
                ))}
                <Tabs.Indicator />
              </Tabs.List>
            </Tabs>
          </div>
        ))}
      </div>
    );
  },
};

export const Controlled: Story = {
  render() {
    const [activeTab, setActiveTab] = useState("account");

    return (
      <div className="w-[400px]">
        <div className="mb-4 text-13">
          Active tab: <span className="font-medium">{activeTab}</span>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => value && setActiveTab(value)}>
          <Tabs.List>
            {tabOptions.map((option) => (
              <Tabs.Trigger key={option.value} value={option.value}>
                {option.label}
              </Tabs.Trigger>
            ))}
            <Tabs.Indicator />
          </Tabs.List>
          {tabOptions.map((option) => (
            <Tabs.Content key={option.value} value={option.value} className="p-4">
              <div className="text-13">Content for {option.label}</div>
            </Tabs.Content>
          ))}
        </Tabs>
      </div>
    );
  },
};

export const DisabledTab: Story = {
  render({ defaultValue }) {
    return (
      <div className="w-[400px]">
        <Tabs defaultValue={defaultValue}>
          <Tabs.List>
            <Tabs.Trigger value="account">Account</Tabs.Trigger>
            <Tabs.Trigger value="password" disabled>
              Password
            </Tabs.Trigger>
            <Tabs.Trigger value="notifications">Notifications</Tabs.Trigger>
            <Tabs.Indicator />
          </Tabs.List>
          <Tabs.Content value="account" className="p-4">
            <div className="text-13">Account content</div>
          </Tabs.Content>
          <Tabs.Content value="password" className="p-4">
            <div className="text-13">Password content (disabled)</div>
          </Tabs.Content>
          <Tabs.Content value="notifications" className="p-4">
            <div className="text-13">Notifications content</div>
          </Tabs.Content>
        </Tabs>
      </div>
    );
  },
};

export const WithIcons: Story = {
  render({ defaultValue }) {
    const tabsWithIcons = [
      { label: "Home", value: "home", icon: HomeIcon },
      { label: "Profile", value: "profile", icon: User },
      { label: "Settings", value: "settings", icon: Settings },
      { label: "Notifications", value: "notifications", icon: Bell },
    ];

    return (
      <div className="w-[500px]">
        <Tabs defaultValue={defaultValue || "home"}>
          <Tabs.List>
            {tabsWithIcons.map((tab) => (
              <Tabs.Trigger key={tab.value} value={tab.value}>
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Tabs.Trigger>
            ))}
            <Tabs.Indicator />
          </Tabs.List>
          {tabsWithIcons.map((tab) => (
            <Tabs.Content key={tab.value} value={tab.value} className="p-4">
              <div className="text-13">Content for {tab.label}</div>
            </Tabs.Content>
          ))}
        </Tabs>
      </div>
    );
  },
};

export const IconsOnly: Story = {
  render({ defaultValue }) {
    const iconTabs = [
      { value: "home", icon: HomeIcon },
      { value: "profile", icon: User },
      { value: "settings", icon: Settings },
      { value: "notifications", icon: Bell },
    ];

    return (
      <div className="w-[300px]">
        <Tabs defaultValue={defaultValue || "home"}>
          <Tabs.List>
            {iconTabs.map((tab) => (
              <Tabs.Trigger key={tab.value} value={tab.value}>
                <tab.icon className="w-4 h-4" />
              </Tabs.Trigger>
            ))}
            <Tabs.Indicator />
          </Tabs.List>
          {iconTabs.map((tab) => (
            <Tabs.Content key={tab.value} value={tab.value} className="p-4">
              <div className="text-13">Content for {tab.value}</div>
            </Tabs.Content>
          ))}
        </Tabs>
      </div>
    );
  },
};

export const DynamicTabs: Story = {
  render() {
    const [tabs, setTabs] = useState([
      { label: "Tab 1", value: "tab1" },
      { label: "Tab 2", value: "tab2" },
    ]);
    const [activeTab, setActiveTab] = useState("tab1");

    const addTab = () => {
      const newTabNum = tabs.length + 1;
      setTabs([...tabs, { label: `Tab ${newTabNum}`, value: `tab${newTabNum}` }]);
    };

    const removeTab = (valueToRemove: string) => {
      const newTabs = tabs.filter((tab) => tab.value !== valueToRemove);
      setTabs(newTabs);
      if (activeTab === valueToRemove && newTabs.length > 0) {
        setActiveTab(newTabs[0].value);
      }
    };

    return (
      <div className="w-[500px]">
        <div className="mb-4">
          <button onClick={addTab} className="px-3 py-1.5 text-13 bg-layer-1 rounded-sm hover:bg-surface-2">
            Add Tab
          </button>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => value && setActiveTab(value)}>
          <Tabs.List>
            {tabs.map((tab) => (
              <Tabs.Trigger key={tab.value} value={tab.value}>
                {tab.label}
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTab(tab.value);
                    }}
                    className="ml-2 hover:text-danger-primary"
                  >
                    ×
                  </button>
                )}
              </Tabs.Trigger>
            ))}
            <Tabs.Indicator />
          </Tabs.List>
          {tabs.map((tab) => (
            <Tabs.Content key={tab.value} value={tab.value} className="p-4">
              <div className="text-13">Content for {tab.label}</div>
            </Tabs.Content>
          ))}
        </Tabs>
      </div>
    );
  },
};

export const FullWidth: Story = {
  render({ defaultValue }) {
    return (
      <div className="w-full max-w-2xl">
        <Tabs defaultValue={defaultValue}>
          <Tabs.List>
            <Tabs.Trigger value="account" className="flex-1">
              Account
            </Tabs.Trigger>
            <Tabs.Trigger value="password" className="flex-1">
              Password
            </Tabs.Trigger>
            <Tabs.Trigger value="notifications" className="flex-1">
              Notifications
            </Tabs.Trigger>
            <Tabs.Indicator />
          </Tabs.List>
          {tabOptions.map((option) => (
            <Tabs.Content key={option.value} value={option.value} className="p-4">
              <div className="text-13">Content for {option.label}</div>
            </Tabs.Content>
          ))}
        </Tabs>
      </div>
    );
  },
};

export const WithComplexContent: Story = {
  render({ defaultValue }) {
    return (
      <div className="w-[600px]">
        <Tabs defaultValue={defaultValue}>
          <Tabs.List>
            {tabOptions.map((option) => (
              <Tabs.Trigger key={option.value} value={option.value}>
                {option.label}
              </Tabs.Trigger>
            ))}
            <Tabs.Indicator />
          </Tabs.List>
          <Tabs.Content value="account" className="p-4">
            <div className="space-y-4">
              <div>
                <label className="text-13 font-medium">Username</label>
                <input type="text" className="mt-1 w-full px-3 py-2 bg-layer-1 rounded-sm" />
              </div>
              <div>
                <label className="text-13 font-medium">Email</label>
                <input type="email" className="mt-1 w-full px-3 py-2 bg-layer-1 rounded-sm" />
              </div>
            </div>
          </Tabs.Content>
          <Tabs.Content value="password" className="p-4">
            <div className="space-y-4">
              <div>
                <label className="text-13 font-medium">Current Password</label>
                <input type="password" className="mt-1 w-full px-3 py-2 bg-layer-1 rounded-sm" />
              </div>
              <div>
                <label className="text-13 font-medium">New Password</label>
                <input type="password" className="mt-1 w-full px-3 py-2 bg-layer-1 rounded-sm" />
              </div>
            </div>
          </Tabs.Content>
          <Tabs.Content value="notifications" className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-13">Email notifications</span>
                <input type="checkbox" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-13">Push notifications</span>
                <input type="checkbox" />
              </div>
            </div>
          </Tabs.Content>
        </Tabs>
      </div>
    );
  },
};
