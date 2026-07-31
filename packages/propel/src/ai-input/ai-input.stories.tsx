/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { expect, userEvent, within } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AIInput } from "./ai-input";

const meta = {
  title: "AI Components/AIInput",
  component: AIInput,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    hasError: false,
    isLoading: false,
  },
  argTypes: {
    mode: {
      control: "select",
      options: ["primary", "transparent"],
      description: "Input visual mode",
      table: { defaultValue: { summary: '"primary"' } },
    },
    inputSize: {
      control: "select",
      options: ["xs", "sm", "md"],
      description: "Input size",
      table: { defaultValue: { summary: '"xs"' } },
    },
    hasError: {
      control: "boolean",
      description: "Has error",
      table: { defaultValue: { summary: "false" } },
    },
    suggestion: {
      control: "text",
      description: "Ghost suggestion text shown below the input. Tab key accepts it.",
    },
    isLoading: {
      control: "boolean",
      description: "Show loading spinner instead of AI icon",
      table: { defaultValue: { summary: "false" } },
    },
  },
} satisfies Meta<typeof AIInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await expect(input).toBeInTheDocument();
    await userEvent.type(input, "How do I create a project?");
    await expect(input).toHaveValue("How do I create a project?");
  },
};

export const WithSuggestion: Story = {
  args: {
    placeholder: "Ask anything…",
    suggestion: "How do I create a new project in Plane?",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("How do I create a new project in Plane?")).toBeInTheDocument();
    await expect(canvas.getByText("Tab")).toBeInTheDocument();
  },
};

export const ErrorState: Story = {
  args: { hasError: true, placeholder: "Something went wrong" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await expect(input).toHaveAttribute("aria-invalid", "true");
  },
};

export const Loading: Story = {
  args: { isLoading: true, placeholder: "Thinking…" },
};
