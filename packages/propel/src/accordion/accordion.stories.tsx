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
import { expect } from "storybook/test";
import { AccordionCloseIcon, AccordionOpenIcon } from "../icons";
import { Accordion } from "./accordion";

const meta = preview.meta({
  title: "Navigation/Accordion",
  component: Accordion.Root,
  parameters: {
    layout: "centered",
    controls: { disable: true },
  },
  subcomponents: {
    Item: Accordion.Item,
    Trigger: Accordion.Trigger,
    Content: Accordion.Content,
  },
  args: {
    children: null,
    className: "w-96",
  },
});

export const Default = meta.story({
  render(args) {
    return (
      <Accordion.Root {...args}>
        <Accordion.Item value="item-1">
          <Accordion.Trigger>What is Plane?</Accordion.Trigger>
          <Accordion.Content>
            Plane is an open-source project management tool designed for developers and teams to plan, track, and manage
            their work efficiently.
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-2">
          <Accordion.Trigger>How do I get started?</Accordion.Trigger>
          <Accordion.Content>
            You can get started by signing up for an account, creating your first workspace, and inviting your team
            members to collaborate.
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-3">
          <Accordion.Trigger>Is it free to use?</Accordion.Trigger>
          <Accordion.Content>
            Plane offers both free and paid plans. The free plan includes essential features for small teams, while paid
            plans unlock advanced functionality.
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    );
  },
  async play({ canvas, userEvent }) {
    // Click the first trigger and verify its content is visible
    const firstTrigger = canvas.getByText("What is Plane?");
    await userEvent.click(firstTrigger);
    await expect(
      canvas.getByText(
        "Plane is an open-source project management tool designed for developers and teams to plan, track, and manage their work efficiently."
      )
    ).toBeVisible();

    // Click the second trigger and verify its content is visible
    const secondTrigger = canvas.getByText("How do I get started?");
    await userEvent.click(secondTrigger);
    await expect(
      canvas.getByText(
        "You can get started by signing up for an account, creating your first workspace, and inviting your team members to collaborate."
      )
    ).toBeVisible();
  },
});

export const SingleOpen = meta.story({
  args: {
    defaultValue: ["item-1"],
  },
  render(args) {
    return (
      <Accordion.Root {...args}>
        <Accordion.Item value="item-1">
          <Accordion.Trigger>Section 1</Accordion.Trigger>
          <Accordion.Content>Content for section 1. Only one section can be open at a time.</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-2">
          <Accordion.Trigger>Section 2</Accordion.Trigger>
          <Accordion.Content>Content for section 2.</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-3">
          <Accordion.Trigger>Section 3</Accordion.Trigger>
          <Accordion.Content>Content for section 3.</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    );
  },
});

export const AllowMultiple = meta.story({
  args: {
    allowMultiple: true,
    defaultValue: ["item-1", "item-2"],
  },
  render(args) {
    return (
      <Accordion.Root {...args}>
        <Accordion.Item value="item-1">
          <Accordion.Trigger>First Section</Accordion.Trigger>
          <Accordion.Content>Multiple sections can be open at the same time.</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-2">
          <Accordion.Trigger>Second Section</Accordion.Trigger>
          <Accordion.Content>This section is also open by default.</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-3">
          <Accordion.Trigger>Third Section</Accordion.Trigger>
          <Accordion.Content>You can open this section while keeping the others open.</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    );
  },
});

export const WithDisabledItem = meta.story({
  render(args) {
    return (
      <Accordion.Root {...args}>
        <Accordion.Item value="item-1">
          <Accordion.Trigger>Enabled Section</Accordion.Trigger>
          <Accordion.Content>This section can be toggled.</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-2" disabled>
          <Accordion.Trigger>Disabled Section</Accordion.Trigger>
          <Accordion.Content>This content cannot be accessed.</Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-3">
          <Accordion.Trigger>Another Enabled Section</Accordion.Trigger>
          <Accordion.Content>This section can also be toggled.</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    );
  },
  async play({ canvas, userEvent }) {
    // Click the enabled trigger and verify its content is visible
    const enabledTrigger = canvas.getByText("Enabled Section");
    await userEvent.click(enabledTrigger);
    await expect(canvas.getByText("This section can be toggled.")).toBeVisible();

    // Verify the disabled trigger button exists
    const disabledTrigger = canvas.getByRole("button", { name: "Disabled Section" });
    await expect(disabledTrigger).toBeVisible();
  },
});

export const CustomIcon = meta.story({
  render(args) {
    return (
      <Accordion.Root {...args}>
        <Accordion.Item value="item-1">
          <Accordion.Trigger
            icon={
              <>
                <AccordionOpenIcon className="hidden transition-transform group-data-[panel-open]:rotate-180" />
                <AccordionCloseIcon className="block transition-transform group-data-[panel-open]:rotate-180" />
              </>
            }
          >
            Custom Chevron Icon
          </Accordion.Trigger>
          <Accordion.Content>
            This accordion uses a custom chevron icon instead of the default plus icon.
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-2">
          <Accordion.Trigger
            icon={
              <>
                <AccordionOpenIcon className="hidden transition-transform group-data-[panel-open]:rotate-180" />
                <AccordionCloseIcon className="block transition-transform group-data-[panel-open]:rotate-180" />
              </>
            }
          >
            Another Section
          </Accordion.Trigger>
          <Accordion.Content>All items in this accordion use the custom icon.</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    );
  },
});

export const AsChildTrigger = meta.story({
  render(args) {
    return (
      <Accordion.Root {...args}>
        <Accordion.Item value="item-1">
          <Accordion.Trigger asChild>
            <span className="w-full rounded-md bg-blue-500 px-4 py-2 text-left text-on-color hover:bg-blue-600">
              Custom Button Trigger
            </span>
          </Accordion.Trigger>
          <Accordion.Content>
            When using asChild, you can completely customize the trigger element without the default icon wrapper.
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item-2">
          <Accordion.Trigger asChild>
            <span className="w-full rounded-md bg-green-500 px-4 py-2 text-left text-on-color hover:bg-green-600">
              Another Custom Trigger
            </span>
          </Accordion.Trigger>
          <Accordion.Content>This gives you full control over the trigger styling and behavior.</Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    );
  },
});
