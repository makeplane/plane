/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    children: "Badge",
    variant: "neutral",
    size: "base",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["neutral", "brand", "warning", "success", "danger"],
      description: "Variant",
      table: { defaultValue: { summary: '"neutral"' } },
    },
    size: {
      control: "select",
      options: ["sm", "base", "lg"],
      description: "Size",
      table: { defaultValue: { summary: '"base"' } },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Neutral: Story = {
  args: {
    variant: "neutral",
    children: "Neutral",
  },
};

export const Brand: Story = {
  args: {
    variant: "brand",
    children: "Brand",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "Warning",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "Success",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Danger",
  },
};
export const AllVariants: Story = {
  render() {
    return (
      <div className="flex flex-wrap gap-2">
        <Badge variant="neutral">Neutral</Badge>
        <Badge variant="brand">Brand</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="danger">Danger</Badge>
      </div>
    );
  },
};
export const AllSizes: Story = {
  render() {
    return (
      <div className="flex items-center gap-2">
        <Badge size="sm">Sm</Badge>
        <Badge size="base">Base</Badge>
        <Badge size="lg">Lg</Badge>
      </div>
    );
  },
};
