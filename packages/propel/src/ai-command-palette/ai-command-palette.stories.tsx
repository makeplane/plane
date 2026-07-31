/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { AICommandPalette } from "./ai-command-palette";

const meta = {
  title: "AI Components/AICommandPalette",
  component: AICommandPalette,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    children: "AICommandPalette",
    open: false,
    aiMode: false,
    isAILoading: false,
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

export const Default: Story = {};
