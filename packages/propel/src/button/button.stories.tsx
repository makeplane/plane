/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { Button } from "./button";

const ICON_OPTIONS = ["none", "plus", "trash", "arrow-right"] as const;
type IconOption = (typeof ICON_OPTIONS)[number];

const ICON_MAP: Record<IconOption, React.ReactElement | undefined> = {
  none: undefined,
  plus: <Plus />,
  trash: <Trash2 />,
  "arrow-right": <ArrowRight />,
};

const ALL_VARIANTS = ["primary", "error-fill", "error-outline", "secondary", "tertiary", "ghost", "link"] as const;

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
    prependIcon: {
      control: "select",
      options: ICON_OPTIONS,
      mapping: ICON_MAP,
      description: "Icon rendered before the label",
      table: { defaultValue: { summary: "none" } },
    },
    appendIcon: {
      control: "select",
      options: ICON_OPTIONS,
      mapping: ICON_MAP,
      description: "Icon rendered after the label",
      table: { defaultValue: { summary: "none" } },
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
    children: "Error Fill",
  },
};

export const ErrorOutline: Story = {
  args: {
    variant: "error-outline",
    children: "Error Outline",
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
        {ALL_VARIANTS.map((v) => (
          <Button key={v} variant={v}>
            {v.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </Button>
        ))}
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

export const WithPrependIcon: Story = {
  name: "With Prepend Icon — all variants",
  render() {
    return (
      <div className="flex flex-wrap gap-2">
        {ALL_VARIANTS.map((v) => (
          <Button key={v} variant={v} prependIcon={<Plus />}>
            {v.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </Button>
        ))}
      </div>
    );
  },
};

export const WithAppendIcon: Story = {
  name: "With Append Icon — all variants",
  render() {
    return (
      <div className="flex flex-wrap gap-2">
        {ALL_VARIANTS.map((v) => (
          <Button key={v} variant={v} appendIcon={<ArrowRight />}>
            {v.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </Button>
        ))}
      </div>
    );
  },
};

export const WithBothIcons: Story = {
  name: "With Both Icons — all variants",
  render() {
    return (
      <div className="flex flex-wrap gap-2">
        {ALL_VARIANTS.map((v) => (
          <Button key={v} variant={v} prependIcon={<Trash2 />} appendIcon={<ArrowRight />}>
            {v.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </Button>
        ))}
      </div>
    );
  },
};
