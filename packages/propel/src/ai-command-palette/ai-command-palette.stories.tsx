/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { expect, userEvent, within } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AICommandPalette } from "./ai-command-palette";

const meta = {
  title: "AI Components/AICommandPalette",
  component: AICommandPalette,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    open: false,
    aiMode: false,
    isAILoading: false,
    placeholder: "Search commands…",
  },
  argTypes: {
    open: {
      control: "boolean",
      description: "Open",
      table: { defaultValue: { summary: "false" } },
    },
    aiMode: {
      control: "boolean",
      description: "Whether the AI query mode is active",
      table: { defaultValue: { summary: "false" } },
    },
    isAILoading: {
      control: "boolean",
      description: "Show spinner while the AI is processing",
      table: { defaultValue: { summary: "false" } },
    },
    placeholder: {
      control: "text",
      description: "Placeholder",
    },
    aiPlaceholder: {
      control: "text",
      description: "Ai placeholder",
    },
  },
} satisfies Meta<typeof AICommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Search commands…");
    await expect(input).toBeInTheDocument();
    await userEvent.type(input, "create");
    await expect(input).toHaveValue("create");
  },
};

export const AIMode: Story = {
  args: { aiMode: true, aiPlaceholder: "Ask AI anything…" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("AI query");
    await expect(input).toBeInTheDocument();
    await userEvent.type(input, "How do I invite a member?");
    await expect(input).toHaveValue("How do I invite a member?");
  },
};

export const AILoading: Story = {
  args: { aiMode: true, isAILoading: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Thinking…")).toBeInTheDocument();
  },
};

export const WithItems: Story = {
  render(args) {
    return (
      <AICommandPalette {...args}>
        <div cmdk-group="">
          <div cmdk-group-heading="">Suggestions</div>
          {["Create project", "Invite member", "Open settings"].map((item) => (
            <div key={item} cmdk-item="" role="option" aria-selected="false">
              {item}
            </div>
          ))}
        </div>
      </AICommandPalette>
    );
  },
};
