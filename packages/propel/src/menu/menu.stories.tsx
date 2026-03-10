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
import { Settings, User, LogOut, Mail, Bell, HelpCircle } from "lucide-react";
import { expect, fn, screen } from "storybook/test";
import { Menu } from "./menu";

const meta = preview.type<{ args: { onMenuItemClick?: () => void } }>().meta({
  title: "Overlays/Menu",
  component: Menu,
  parameters: {
    layout: "centered",
  },
  subcomponents: {
    MenuItem: Menu.MenuItem,
    SubMenu: Menu.SubMenu,
  },
  args: {
    children: null,
  },
});

export const Default = meta.story({
  args: { label: "Options" },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={() => alert("Option 1 clicked")}>Option 1</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Option 2 clicked")}>Option 2</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Option 3 clicked")}>Option 3</Menu.MenuItem>
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    const button = canvas.getByRole("button", { name: "Options" });
    await userEvent.click(button);
    await expect(await screen.findByText("Option 1")).toBeVisible();
    await expect(await screen.findByText("Option 2")).toBeVisible();
    await expect(await screen.findByText("Option 3")).toBeVisible();
  },
});

export const ClickMenuItem = meta.story({
  args: { label: "Options", onMenuItemClick: fn() },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={args.onMenuItemClick}>Option 1</Menu.MenuItem>
      </Menu>
    );
  },
  async play({ canvas, userEvent, args }) {
    const button = canvas.getByRole("button", { name: "Options" });
    await userEvent.click(button);
    const option = await screen.findByText("Option 1");
    await userEvent.click(option);
    await expect(args.onMenuItemClick).toHaveBeenCalledOnce();
  },
});

export const WithIcons = meta.story({
  args: { label: "Account" },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={() => alert("Profile")}>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </div>
        </Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Settings")}>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </div>
        </Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Messages")}>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Messages</span>
          </div>
        </Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Logout")}>
          <div className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </div>
        </Menu.MenuItem>
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Account" }));
    await expect(await screen.findByText("Profile")).toBeVisible();
  },
});

export const Ellipsis = meta.story({
  args: { ellipsis: true },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={() => alert("Edit")}>Edit</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Duplicate")}>Duplicate</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Delete")}>Delete</Menu.MenuItem>
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    const button = canvas.getByRole("button");
    await userEvent.click(button);
    await expect(await screen.findByText("Edit")).toBeVisible();
  },
});

export const VerticalEllipsis = meta.story({
  args: { verticalEllipsis: true },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={() => alert("Edit")}>Edit</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Duplicate")}>Duplicate</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Delete")}>Delete</Menu.MenuItem>
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    const button = canvas.getByRole("button");
    await userEvent.click(button);
    await expect(await screen.findByText("Edit")).toBeVisible();
  },
});

export const NoBorder = meta.story({
  args: { label: "Actions", noBorder: true },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={() => alert("Action 1")}>Action 1</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Action 2")}>Action 2</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Action 3")}>Action 3</Menu.MenuItem>
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Actions" }));
    await expect(await screen.findByText("Action 1")).toBeVisible();
  },
});

export const NoChevron = meta.story({
  args: { label: "Menu", noChevron: true },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={() => alert("Item 1")}>Item 1</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Item 2")}>Item 2</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Item 3")}>Item 3</Menu.MenuItem>
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Menu" }));
    await expect(await screen.findByText("Item 1")).toBeVisible();
  },
});

export const Disabled = meta.story({
  args: { label: "Disabled Menu", disabled: true },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={() => alert("Item 1")}>Item 1</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Item 2")}>Item 2</Menu.MenuItem>
      </Menu>
    );
  },
});

export const DisabledItems = meta.story({
  args: { label: "Options" },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={() => alert("Enabled")}>Enabled Item</Menu.MenuItem>
        <Menu.MenuItem disabled>Disabled Item</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Enabled")}>Another Enabled Item</Menu.MenuItem>
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    const button = canvas.getByRole("button", { name: "Options" });
    await userEvent.click(button);
    await expect(await screen.findByText("Disabled Item")).toBeVisible();
  },
});

export const CustomButton = meta.story({
  args: {
    customButton: (
      <span className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600">Custom Button</span>
    ),
  },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={() => alert("Option 1")}>Option 1</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Option 2")}>Option 2</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Option 3")}>Option 3</Menu.MenuItem>
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByText("Custom Button"));
    await expect(await screen.findByText("Option 1")).toBeVisible();
  },
});

export const WithSubmenu = meta.story({
  args: { label: "File" },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={() => alert("New File")}>New File</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Open")}>Open</Menu.MenuItem>
        <Menu.SubMenu
          trigger="Export"
          className="min-w-[12rem] rounded-md border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200"
        >
          <Menu.MenuItem onClick={() => alert("Export as PDF")}>Export as PDF</Menu.MenuItem>
          <Menu.MenuItem onClick={() => alert("Export as CSV")}>Export as CSV</Menu.MenuItem>
          <Menu.MenuItem onClick={() => alert("Export as JSON")}>Export as JSON</Menu.MenuItem>
        </Menu.SubMenu>
        <Menu.MenuItem onClick={() => alert("Close")}>Close</Menu.MenuItem>
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "File" }));
    await expect(await screen.findByText("New File")).toBeVisible();
    await expect(screen.getByText("Export")).toBeVisible();
  },
});

export const MaxHeightSmall = meta.story({
  args: { label: "Small Height", maxHeight: "sm" },
  render(args) {
    return (
      <Menu {...args}>
        {Array.from({ length: 10 }, (_, i) => (
          <Menu.MenuItem key={i} onClick={() => alert(`Item ${i + 1}`)}>
            Item {i + 1}
          </Menu.MenuItem>
        ))}
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Small Height" }));
    await expect(await screen.findByText("Item 1")).toBeVisible();
  },
});

export const MaxHeightLarge = meta.story({
  args: { label: "Large Height", maxHeight: "lg" },
  render(args) {
    return (
      <Menu {...args}>
        {Array.from({ length: 15 }, (_, i) => (
          <Menu.MenuItem key={i} onClick={() => alert(`Item ${i + 1}`)}>
            Item {i + 1}
          </Menu.MenuItem>
        ))}
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Large Height" }));
    await expect(await screen.findByText("Item 1")).toBeVisible();
  },
});

export const ComplexMenu = meta.story({
  args: { label: "More Actions", buttonClassName: "bg-gray-100" },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={() => alert("Notifications")}>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            <span className="ml-auto rounded-sm bg-red-500 px-2 py-0.5 text-11 text-on-color">3</span>
          </div>
        </Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Help")}>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            <span>Help Center</span>
          </div>
        </Menu.MenuItem>
        <Menu.SubMenu
          trigger="Settings"
          className="min-w-[12rem] rounded-md border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200"
        >
          <Menu.MenuItem onClick={() => alert("General Settings")}>General</Menu.MenuItem>
          <Menu.MenuItem onClick={() => alert("Privacy Settings")}>Privacy</Menu.MenuItem>
          <Menu.MenuItem onClick={() => alert("Security Settings")}>Security</Menu.MenuItem>
        </Menu.SubMenu>
        <div className="my-1 border-t border-gray-200" />
        <Menu.MenuItem onClick={() => alert("Logout")}>
          <div className="flex items-center gap-2 text-danger-primary">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </div>
        </Menu.MenuItem>
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "More Actions" }));
    await expect(await screen.findByText("Notifications")).toBeVisible();
  },
});

export const CustomStyles = meta.story({
  args: {
    label: "Styled Menu",
    buttonClassName: "bg-purple-500 text-on-color hover:bg-purple-600",
    optionsClassName: "bg-purple-50 border-purple-300",
  },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={() => alert("Item 1")} className="hover:bg-purple-200">
          Item 1
        </Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Item 2")} className="hover:bg-purple-200">
          Item 2
        </Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Item 3")} className="hover:bg-purple-200">
          Item 3
        </Menu.MenuItem>
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Styled Menu" }));
    await expect(await screen.findByText("Item 1")).toBeVisible();
  },
});

export const MaxHeightRegular = meta.story({
  args: { label: "Regular Height", maxHeight: "rg" },
  render(args) {
    return (
      <Menu {...args}>
        {Array.from({ length: 10 }, (_, i) => (
          <Menu.MenuItem key={i} onClick={() => alert(`Item ${i + 1}`)}>
            Item {i + 1}
          </Menu.MenuItem>
        ))}
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Regular Height" }));
    await expect(await screen.findByText("Item 1")).toBeVisible();
  },
});

export const WithAriaLabel = meta.story({
  args: { label: "Actions", ariaLabel: "User actions menu", tabIndex: 0 },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={() => alert("Action 1")}>Action 1</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Action 2")}>Action 2</Menu.MenuItem>
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    const button = canvas.getByRole("button", { name: "User actions menu" });
    await userEvent.click(button);
    await expect(await screen.findByText("Action 1")).toBeVisible();
  },
});

export const WithMenuButtonCallback = meta.story({
  args: { label: "Callback", menuButtonOnClick: fn(), onMenuClose: fn() },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={() => alert("Item 1")}>Item 1</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Item 2")}>Item 2</Menu.MenuItem>
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    const button = canvas.getByRole("button", { name: "Callback" });
    await userEvent.click(button);
    await expect(await screen.findByText("Item 1")).toBeVisible();
  },
});

export const OpenOnHover = meta.story({
  args: { label: "Hover Me", openOnHover: true },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={() => alert("Item 1")}>Item 1</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Item 2")}>Item 2</Menu.MenuItem>
      </Menu>
    );
  },
});

export const WithMenuItemsClassName = meta.story({
  args: { label: "Custom Items", menuItemsClassName: "custom-menu-items" },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={() => alert("Item 1")}>Item 1</Menu.MenuItem>
        <Menu.MenuItem onClick={() => alert("Item 2")}>Item 2</Menu.MenuItem>
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Custom Items" }));
    await expect(await screen.findByText("Item 1")).toBeVisible();
  },
});

export const DisabledSubmenu = meta.story({
  args: { label: "With Disabled Sub" },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={() => alert("Normal")}>Normal Item</Menu.MenuItem>
        <Menu.SubMenu
          trigger="Disabled Sub"
          disabled
          className="min-w-[12rem] rounded-md border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-11 shadow-raised-200"
        >
          <Menu.MenuItem onClick={() => alert("Sub Item")}>Sub Item</Menu.MenuItem>
        </Menu.SubMenu>
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "With Disabled Sub" }));
    await expect(await screen.findByText("Normal Item")).toBeVisible();
  },
});

export const CloseByReclicking = meta.story({
  args: { label: "Toggle", onMenuClose: fn(), onMenuItemClick: fn() },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={args.onMenuItemClick}>Item 1</Menu.MenuItem>
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    const button = canvas.getByRole("button", { name: "Toggle" });
    await userEvent.click(button);
    await expect(await screen.findByText("Item 1")).toBeVisible();
    await userEvent.click(button);
  },
});

export const CustomButtonWithClose = meta.story({
  args: {
    customButton: <span>Custom Trigger</span>,
    customButtonClassName: "px-2 py-1 bg-surface-1 border rounded",
    customButtonTabIndex: 0,
    menuButtonOnClick: fn(),
    onMenuClose: fn(),
    onMenuItemClick: fn(),
  },
  render(args) {
    return (
      <Menu {...args}>
        <Menu.MenuItem onClick={args.onMenuItemClick}>Action</Menu.MenuItem>
      </Menu>
    );
  },
  async play({ canvas, userEvent }) {
    const trigger = canvas.getByText("Custom Trigger");
    await userEvent.click(trigger);
    await expect(await screen.findByText("Action")).toBeVisible();
    await userEvent.click(trigger);
  },
});
