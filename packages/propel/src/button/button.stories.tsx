/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    children: "Button",
    variant: "primary",
    size: "base",
    loading: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "error-fill", "error-outline", "secondary", "tertiary", "ghost", "link"],
      description: "Variant",
      table: { defaultValue: { summary: '"primary"' } },
    },
    size: {
      control: "select",
      options: ["sm", "base", "lg", "xl"],
      description: "Size",
      table: { defaultValue: { summary: '"base"' } },
    },
    loading: {
      control: "boolean",
      description: "Loading",
      table: { defaultValue: { summary: "false" } },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary",
  },
};

export const ErrorFill: Story = {
  args: {
    variant: "error-fill",
    children: "Error-fill",
  },
};

export const ErrorOutline: Story = {
  args: {
    variant: "error-outline",
    children: "Error-outline",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
};

export const Tertiary: Story = {
  args: {
    variant: "tertiary",
    children: "Tertiary",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "Link",
  },
};
export const AllVariants: Story = {
  render() {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="primary">Primary</Button>
        <Button variant="error-fill">Error fill</Button>
        <Button variant="error-outline">Error outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="tertiary">Tertiary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    );
  },
};
export const AllSizes: Story = {
  render() {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm">Sm</Button>
        <Button size="base">Base</Button>
        <Button size="lg">Lg</Button>
        <Button size="xl">Xl</Button>
      </div>
    );
  },
};
