/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThinkingIndicator } from "./thinking-indicator";

const meta = {
  title: "AI Components/ThinkingIndicator",
  component: ThinkingIndicator,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    size: "base",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "base", "lg"],
      description: "Size",
      table: { defaultValue: { summary: '"base"' } },
    },
    status: {
      control: "select",
      options: ["thinking", "typing", "done"],
      description: "Status",
      table: { defaultValue: { summary: '"thinking"' } },
    },
  },
} satisfies Meta<typeof ThinkingIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Thinking: Story = {
  args: { status: "thinking" },
};

export const Typing: Story = {
  args: { status: "typing" },
};

export const Done: Story = {
  args: { status: "done" },
};

export const AllStatuses: Story = {
  render() {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="w-16 text-12 text-tertiary">thinking</span>
          <ThinkingIndicator status="thinking" />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-16 text-12 text-tertiary">typing</span>
          <ThinkingIndicator status="typing" />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-16 text-12 text-tertiary">done</span>
          <ThinkingIndicator status="done" />
        </div>
      </div>
    );
  },
};

export const AllSizes: Story = {
  render() {
    return (
      <div className="flex items-center gap-2">
        <ThinkingIndicator size="sm" />
        <ThinkingIndicator size="base" />
        <ThinkingIndicator size="lg" />
      </div>
    );
  },
};
