import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Settings, User, Bell } from "lucide-react";
import { HomeIcon } from "../icons/workspace/home-icon";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsIndicator } from "./tabs";

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
    TabsList,
    TabsTrigger,
    TabsContent,
    TabsIndicator,
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
          <TabsList>
            {tabOptions.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
            <TabsIndicator />
          </TabsList>
          {tabOptions.map((option) => (
            <TabsContent key={option.value} value={option.value} className="p-4">
              <div className="text-sm">
                <h3 className="font-medium mb-2">{option.label}</h3>
                <p className="text-custom-text-300">Content for the {option.label.toLowerCase()} tab.</p>
              </div>
            </TabsContent>
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
            <div className="text-sm font-medium">{sizeLabels[size]}</div>
            <Tabs defaultValue={defaultValue}>
              <TabsList>
                {tabOptions.map((option) => (
                  <TabsTrigger key={option.value} value={option.value} size={size}>
                    {option.label}
                  </TabsTrigger>
                ))}
                <TabsIndicator />
              </TabsList>
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
        <div className="mb-4 text-sm">
          Active tab: <span className="font-medium">{activeTab}</span>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => value && setActiveTab(value)}>
          <TabsList>
            {tabOptions.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
            <TabsIndicator />
          </TabsList>
          {tabOptions.map((option) => (
            <TabsContent key={option.value} value={option.value} className="p-4">
              <div className="text-sm">Content for {option.label}</div>
            </TabsContent>
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
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password" disabled>
              Password
            </TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsIndicator />
          </TabsList>
          <TabsContent value="account" className="p-4">
            <div className="text-sm">Account content</div>
          </TabsContent>
          <TabsContent value="password" className="p-4">
            <div className="text-sm">Password content (disabled)</div>
          </TabsContent>
          <TabsContent value="notifications" className="p-4">
            <div className="text-sm">Notifications content</div>
          </TabsContent>
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
          <TabsList>
            {tabsWithIcons.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            ))}
            <TabsIndicator />
          </TabsList>
          {tabsWithIcons.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="p-4">
              <div className="text-sm">Content for {tab.label}</div>
            </TabsContent>
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
          <TabsList>
            {iconTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                <tab.icon className="w-4 h-4" />
              </TabsTrigger>
            ))}
            <TabsIndicator />
          </TabsList>
          {iconTabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="p-4">
              <div className="text-sm">Content for {tab.value}</div>
            </TabsContent>
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
          <button
            onClick={addTab}
            className="px-3 py-1.5 text-sm bg-custom-background-80 rounded hover:bg-custom-background-90"
          >
            Add Tab
          </button>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => value && setActiveTab(value)}>
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTab(tab.value);
                    }}
                    className="ml-2 hover:text-red-500"
                  >
                    ×
                  </button>
                )}
              </TabsTrigger>
            ))}
            <TabsIndicator />
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="p-4">
              <div className="text-sm">Content for {tab.label}</div>
            </TabsContent>
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
          <TabsList>
            <TabsTrigger value="account" className="flex-1">
              Account
            </TabsTrigger>
            <TabsTrigger value="password" className="flex-1">
              Password
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1">
              Notifications
            </TabsTrigger>
            <TabsIndicator />
          </TabsList>
          {tabOptions.map((option) => (
            <TabsContent key={option.value} value={option.value} className="p-4">
              <div className="text-sm">Content for {option.label}</div>
            </TabsContent>
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
          <TabsList>
            {tabOptions.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
            <TabsIndicator />
          </TabsList>
          <TabsContent value="account" className="p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <input type="text" className="mt-1 w-full px-3 py-2 bg-custom-background-80 rounded" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input type="email" className="mt-1 w-full px-3 py-2 bg-custom-background-80 rounded" />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="password" className="p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Current Password</label>
                <input type="password" className="mt-1 w-full px-3 py-2 bg-custom-background-80 rounded" />
              </div>
              <div>
                <label className="text-sm font-medium">New Password</label>
                <input type="password" className="mt-1 w-full px-3 py-2 bg-custom-background-80 rounded" />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="notifications" className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email notifications</span>
                <input type="checkbox" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Push notifications</span>
                <input type="checkbox" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  },
};
