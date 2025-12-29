import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { Switch } from "./root";

const meta = {
  title: "Components/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: { value: false, onChange: () => {} },
  render(args) {
    const [{ value }, updateArgs] = useArgs();
    const setValue = (newValue: boolean) => updateArgs({ value: newValue });
    return <Switch {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: { value: true },
};

export const WithLabel: Story = {
  render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="flex items-center gap-2">
        <Switch {...args} value={value} onChange={setValue} label="Enable notifications" />
        <label className="text-13">Enable notifications</label>
      </div>
    );
  },
};

export const Small: Story = {
  args: { size: "sm" },
};

export const Medium: Story = {
  args: { size: "md" },
};

export const Large: Story = {
  args: { size: "lg" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledChecked: Story = {
  args: { value: true, disabled: true },
};

export const AllSizes: Story = {
  render() {
    const [small, setSmall] = useState(false);
    const [medium, setMedium] = useState(false);
    const [large, setLarge] = useState(false);

    return (
      <div className="flex items-center gap-6">
        <div className="text-center">
          <Switch value={small} onChange={setSmall} size="sm" />
          <p className="mt-2 text-11 text-gray-600">Small</p>
        </div>
        <div className="text-center">
          <Switch value={medium} onChange={setMedium} size="md" />
          <p className="mt-2 text-11 text-gray-600">Medium</p>
        </div>
        <div className="text-center">
          <Switch value={large} onChange={setLarge} size="lg" />
          <p className="mt-2 text-11 text-gray-600">Large</p>
        </div>
      </div>
    );
  },
};

export const AllStates: Story = {
  render() {
    const [unchecked, setUnchecked] = useState(false);
    const [checked, setChecked] = useState(true);
    const [disabledUnchecked] = useState(false);
    const [disabledChecked] = useState(true);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Switch value={unchecked} onChange={setUnchecked} />
          <span className="text-13 text-gray-600">Unchecked</span>
        </div>
        <div className="flex items-center gap-4">
          <Switch value={checked} onChange={setChecked} />
          <span className="text-13 text-gray-600">Checked</span>
        </div>
        <div className="flex items-center gap-4">
          <Switch value={disabledUnchecked} onChange={() => {}} disabled />
          <span className="text-13 text-gray-600">Disabled Unchecked</span>
        </div>
        <div className="flex items-center gap-4">
          <Switch value={disabledChecked} onChange={() => {}} disabled />
          <span className="text-13 text-gray-600">Disabled Checked</span>
        </div>
      </div>
    );
  },
};

export const InForm: Story = {
  render() {
    const [notifications, setNotifications] = useState(true);
    const [marketing, setMarketing] = useState(false);
    const [updates, setUpdates] = useState(true);

    return (
      <div className="w-80 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <h3 className="text-16 font-semibold">Notification Settings</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-13 font-medium">Push Notifications</p>
              <p className="text-11 text-gray-500">Receive push notifications on your device</p>
            </div>
            <Switch value={notifications} onChange={setNotifications} size="md" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-13 font-medium">Marketing Emails</p>
              <p className="text-11 text-gray-500">Receive emails about new features</p>
            </div>
            <Switch value={marketing} onChange={setMarketing} size="md" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-13 font-medium">Product Updates</p>
              <p className="text-11 text-gray-500">Get notified about product updates</p>
            </div>
            <Switch value={updates} onChange={setUpdates} size="md" />
          </div>
        </div>
      </div>
    );
  },
};

export const WithDescription: Story = {
  render() {
    const [enabled, setEnabled] = useState(false);

    return (
      <div className="w-96 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-13 font-semibold">Enable Two-Factor Authentication</h4>
            <p className="mt-1 text-11 text-gray-500">
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>
          </div>
          <Switch value={enabled} onChange={setEnabled} size="md" className="ml-4" />
        </div>
      </div>
    );
  },
};

export const Interactive: Story = {
  render() {
    const [enabled, setEnabled] = useState(false);

    return (
      <div className="w-80 space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <span className="text-13 font-medium">Feature Toggle</span>
          <Switch value={enabled} onChange={setEnabled} size="md" />
        </div>
        <div className="rounded-sm bg-gray-50 p-4">
          <p className="text-13 text-gray-700">
            Status: <span className="font-semibold">{enabled ? "Enabled" : "Disabled"}</span>
          </p>
          {enabled && <p className="mt-2 text-11 text-success-primary">Feature is now active and ready to use!</p>}
        </div>
      </div>
    );
  },
};

export const CustomStyles: Story = {
  render() {
    const [value, setValue] = useState(false);

    return (
      <div className="flex items-center gap-4">
        <Switch
          value={value}
          onChange={setValue}
          size="lg"
          className="border-2 border-purple-300 data-[state=checked]:bg-purple-500"
        />
        <span className="text-13">Custom styled switch</span>
      </div>
    );
  },
};

export const MultipleControls: Story = {
  render() {
    const [settings, setSettings] = useState({
      feature1: true,
      feature2: false,
      feature3: true,
      feature4: false,
      feature5: true,
    });

    const toggleSetting = (key: keyof typeof settings) => {
      setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
      <div className="w-96 rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-16 font-semibold">Feature Flags</h3>
        <div className="space-y-3">
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-13 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
              <Switch value={value} onChange={() => toggleSetting(key as keyof typeof settings)} size="sm" />
            </div>
          ))}
        </div>
      </div>
    );
  },
};
