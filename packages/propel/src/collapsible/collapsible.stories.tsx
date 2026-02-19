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
import { ChevronDownIcon } from "../icons/arrows/chevron-down";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./collapsible";

const meta = preview.meta({
  component: Collapsible,
  subcomponents: {
    CollapsibleTrigger,
    CollapsibleContent,
  },
  parameters: {
    layout: "centered",
  },
});

export const Default = meta.story({
  args: {
    className: "w-96",
  },
  render(args) {
    return (
      <Collapsible {...args}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200">
          <span className="font-semibold">Click to toggle</span>
          <ChevronDownIcon className="h-4 w-4 transition-transform group-data-[panel-open]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2">
          <div className="rounded-md border border-gray-200 p-4">
            <p className="text-13">This is the collapsible content that can be shown or hidden.</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
  async play({ canvas, userEvent }) {
    const trigger = canvas.getByText("Click to toggle");
    await expect(trigger).toBeVisible();
    await userEvent.click(trigger);
    await expect(canvas.getByText("This is the collapsible content that can be shown or hidden.")).toBeVisible();
    await userEvent.click(trigger);
  },
});

export const DefaultOpen = meta.story({
  args: {
    defaultOpen: true,
    className: "w-96",
  },
  render(args) {
    return (
      <Collapsible {...args}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200">
          <span className="font-semibold">Default open</span>
          <ChevronDownIcon className="h-4 w-4 transition-transform group-data-[panel-open]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2">
          <div className="rounded-md border border-gray-200 p-4">
            <p className="text-13">This collapsible starts open.</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
});

export const Controlled = meta.story({
  args: {
    open: true,
    className: "w-96",
  },
  render(args) {
    return (
      <Collapsible {...args}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200">
          <span className="font-semibold">Controlled collapsible</span>
          <ChevronDownIcon className="h-4 w-4 transition-transform group-data-[panel-open]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2">
          <div className="rounded-md border border-gray-200 p-4">
            <p className="text-13">Controlled open state.</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
});

export const NestedContent = meta.story({
  args: {
    className: "w-96",
  },
  render(args) {
    return (
      <Collapsible {...args}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200">
          <span className="font-semibold">Nested content</span>
          <ChevronDownIcon className="h-4 w-4 transition-transform group-data-[panel-open]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2">
          <div className="space-y-2 rounded-md border border-gray-200 p-4">
            <h4 className="font-semibold">Section 1</h4>
            <p className="text-13">First section content.</p>
            <h4 className="font-semibold">Section 2</h4>
            <p className="text-13">Second section content.</p>
            <ul className="list-inside list-disc text-13">
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
});

export const CustomStyling = meta.story({
  args: {
    className: "w-96",
  },
  render(args) {
    return (
      <Collapsible {...args}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-tertiary shadow-lg transition-all hover:shadow-xl">
          <span className="text-16 font-bold">Custom styled trigger</span>
          <ChevronDownIcon className="h-5 w-5 transition-transform group-data-[panel-open]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4">
          <div className="rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 p-6 shadow-md">
            <p className="text-purple-900">Custom styling with gradients and shadows.</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
});

export const TriggerWithRenderProp = meta.story({
  args: {
    className: "w-96",
  },
  render(args) {
    return (
      <Collapsible {...args}>
        <CollapsibleTrigger
          render={<div />}
          nativeButton={false}
          className="flex cursor-pointer items-center justify-between rounded-md bg-blue-100 px-4 py-2 hover:bg-blue-200"
        >
          <span className="font-semibold">Trigger rendered as div</span>
          <ChevronDownIcon className="h-4 w-4 transition-transform group-data-[panel-open]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-2">
          <div className="rounded-md border border-gray-200 p-4">
            <p className="text-13">Trigger element is a &lt;div&gt; instead of a button.</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
});

export const ContentWithRenderProp = meta.story({
  args: {
    className: "w-96",
  },
  render(args) {
    return (
      <Collapsible {...args}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200">
          <span className="font-semibold">Render content as section</span>
          <ChevronDownIcon className="h-4 w-4 transition-transform group-data-[panel-open]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent render={<section />} className="mt-2">
          <div className="rounded-md border border-gray-200 p-4">
            <p className="text-13">Content is rendered as a &lt;section&gt; element.</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
});

export const WithRenderProps = meta.story({
  args: {
    className: "w-96",
  },
  render(args) {
    return (
      <Collapsible {...args}>
        <CollapsibleTrigger
          render={<div />}
          nativeButton={false}
          className="flex cursor-pointer items-center justify-between rounded-md bg-purple-100 px-4 py-2 hover:bg-purple-200"
        >
          <span className="font-semibold">Custom trigger</span>
          <ChevronDownIcon className="h-4 w-4 transition-transform group-data-[panel-open]:rotate-180" />
        </CollapsibleTrigger>

        <CollapsibleContent render={<article />} className="mt-2">
          <div className="rounded-md border border-gray-200 p-4">
            <p className="text-13">Trigger is a &lt;div&gt;, content is an &lt;article&gt;.</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
});
