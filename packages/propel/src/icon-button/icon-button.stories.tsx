/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "./icon-button";

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    className={className}
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const meta = {
  title: "Components/IconButton",
  component: IconButton,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    variant: "primary",
    size: "base",
    icon: PlusIcon,
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "error-fill", "error-outline", "secondary", "tertiary", "ghost"],
      description: "Variant",
      table: { defaultValue: { summary: '"primary"' } },
    },
    size: {
      control: "select",
      options: ["sm", "base", "lg", "xl"],
      description: "Size",
      table: { defaultValue: { summary: '"base"' } },
    },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Primary: Story = { args: { variant: "primary" } };
export const ErrorFill: Story = { args: { variant: "error-fill" } };
export const ErrorOutline: Story = { args: { variant: "error-outline" } };
export const Secondary: Story = { args: { variant: "secondary" } };
export const Tertiary: Story = { args: { variant: "tertiary" } };
export const Ghost: Story = { args: { variant: "ghost" } };

export const AllVariants: Story = {
  render() {
    return (
      <div className="flex flex-wrap gap-2">
        <IconButton icon={PlusIcon} variant="primary" />
        <IconButton icon={PlusIcon} variant="error-fill" />
        <IconButton icon={PlusIcon} variant="error-outline" />
        <IconButton icon={PlusIcon} variant="secondary" />
        <IconButton icon={PlusIcon} variant="tertiary" />
        <IconButton icon={PlusIcon} variant="ghost" />
      </div>
    );
  },
};

export const AllSizes: Story = {
  render() {
    return (
      <div className="flex items-center gap-2">
        <IconButton icon={PlusIcon} size="sm" />
        <IconButton icon={PlusIcon} size="base" />
        <IconButton icon={PlusIcon} size="lg" />
        <IconButton icon={PlusIcon} size="xl" />
      </div>
    );
  },
};
