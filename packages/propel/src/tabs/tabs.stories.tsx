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
import { expect, fn } from "storybook/test";
import { Settings, User, Bell } from "lucide-react";
import { HomeIcon } from "../icons/workspace/home-icon";
import { Tabs } from "./tabs";

const tabOptions = [
  { label: "Account", value: "account" },
  { label: "Password", value: "password" },
  { label: "Notifications", value: "notifications" },
];

const meta = preview.meta({
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
});

export const Basic = meta.story({
  render(args) {
    return (
      <div className="w-[400px]">
        <Tabs {...args}>
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
  async play({ canvas, userEvent }) {
    const accountTab = canvas.getByRole("tab", { name: "Account" });
    await expect(accountTab).toBeVisible();
    await expect(canvas.getByText("Content for the account tab.")).toBeVisible();

    const passwordTab = canvas.getByRole("tab", { name: "Password" });
    await userEvent.click(passwordTab);
    await expect(canvas.getByText("Content for the password tab.")).toBeVisible();

    const notificationsTab = canvas.getByRole("tab", { name: "Notifications" });
    await userEvent.click(notificationsTab);
    await expect(canvas.getByText("Content for the notifications tab.")).toBeVisible();
  },
});

export const Controlled = meta.story({
  args: {
    defaultValue: undefined,
    value: "account",
    onValueChange: fn(),
  },
  render(args) {
    return (
      <div className="w-[400px]">
        <Tabs {...args}>
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
});

export const DisabledTab = meta.story({
  render(args) {
    return (
      <div className="w-[400px]">
        <Tabs {...args}>
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
});

export const WithIcons = meta.story({
  args: {
    defaultValue: "home",
  },
  render(args) {
    const tabsWithIcons = [
      { label: "Home", value: "home", icon: HomeIcon },
      { label: "Profile", value: "profile", icon: User },
      { label: "Settings", value: "settings", icon: Settings },
      { label: "Notifications", value: "notifications", icon: Bell },
    ];

    return (
      <div className="w-[500px]">
        <Tabs {...args}>
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
  async play({ canvas, userEvent }) {
    const profileTab = canvas.getByRole("tab", { name: "Profile" });
    await userEvent.click(profileTab);
    await expect(canvas.getByText("Content for Profile")).toBeVisible();
  },
});

export const IconsOnly = meta.story({
  args: {
    defaultValue: "home",
  },
  render(args) {
    const iconTabs = [
      { value: "home", icon: HomeIcon },
      { value: "profile", icon: User },
      { value: "settings", icon: Settings },
      { value: "notifications", icon: Bell },
    ];

    return (
      <div className="w-[300px]">
        <Tabs {...args}>
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
});

export const FullWidth = meta.story({
  render(args) {
    return (
      <div className="w-full max-w-2xl">
        <Tabs {...args}>
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
});

export const WithComplexContent = meta.story({
  render(args) {
    return (
      <div className="w-[600px]">
        <Tabs {...args}>
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
                <label htmlFor="username" className="text-13 font-medium">
                  Username
                </label>
                <input id="username" type="text" className="mt-1 w-full px-3 py-2 bg-layer-1 rounded-sm" />
              </div>
              <div>
                <label htmlFor="email" className="text-13 font-medium">
                  Email
                </label>
                <input id="email" type="email" className="mt-1 w-full px-3 py-2 bg-layer-1 rounded-sm" />
              </div>
            </div>
          </Tabs.Content>
          <Tabs.Content value="password" className="p-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="current-password" className="text-13 font-medium">
                  Current Password
                </label>
                <input id="current-password" type="password" className="mt-1 w-full px-3 py-2 bg-layer-1 rounded-sm" />
              </div>
              <div>
                <label htmlFor="new-password" className="text-13 font-medium">
                  New Password
                </label>
                <input id="new-password" type="password" className="mt-1 w-full px-3 py-2 bg-layer-1 rounded-sm" />
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
});
