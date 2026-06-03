/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card, ECardVariant, ECardSpacing, ECardDirection } from "./card";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: (
      <>
        <h3 className="text-16 font-semibold">Card Title</h3>
        <p className="text-gray-600 text-13">This is a default card with shadow and large spacing.</p>
      </>
    ),
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithShadow: Story = {
  args: {
    variant: ECardVariant.WITH_SHADOW,
    children: (
      <>
        <h3 className="text-16 font-semibold">Card with Shadow</h3>
        <p className="text-gray-600 text-13">Hover over this card to see the shadow effect.</p>
      </>
    ),
  },
};

export const WithoutShadow: Story = {
  args: {
    variant: ECardVariant.WITHOUT_SHADOW,
    children: (
      <>
        <h3 className="text-16 font-semibold">Card without Shadow</h3>
        <p className="text-gray-600 text-13">This card has no shadow effect on hover.</p>
      </>
    ),
  },
};

export const SmallSpacing: Story = {
  args: {
    spacing: ECardSpacing.SM,
    children: (
      <>
        <h3 className="text-16 font-semibold">Small Spacing</h3>
        <p className="text-gray-600 text-13">This card uses small spacing (p-4).</p>
      </>
    ),
  },
};

export const LargeSpacing: Story = {
  args: {
    spacing: ECardSpacing.LG,
    children: (
      <>
        <h3 className="text-16 font-semibold">Large Spacing</h3>
        <p className="text-gray-600 text-13">This card uses large spacing (p-6).</p>
      </>
    ),
  },
};

export const ColumnDirection: Story = {
  args: {
    direction: ECardDirection.COLUMN,
    children: (
      <>
        <h3 className="text-16 font-semibold">Column Direction</h3>
        <p className="text-gray-600 text-13">Content is arranged vertically.</p>
        <button className="bg-blue-500 rounded-sm px-4 py-2 text-on-color">Action</button>
      </>
    ),
  },
};

export const RowDirection: Story = {
  args: {
    direction: ECardDirection.ROW,
    children: (
      <>
        <div className="flex-shrink-0">
          <div className="bg-blue-500 h-12 w-12 rounded-sm" />
        </div>
        <div className="flex-1">
          <h3 className="text-16 font-semibold">Row Direction</h3>
          <p className="text-gray-600 text-13">Content is arranged horizontally.</p>
        </div>
      </>
    ),
  },
};

export const ProductCard: Story = {
  args: {
    variant: ECardVariant.WITH_SHADOW,
    spacing: ECardSpacing.LG,
    direction: ECardDirection.COLUMN,
    children: (
      <>
        <div className="bg-gray-200 h-48 w-full rounded-sm" />
        <h3 className="text-18 font-bold">Product Name</h3>
        <p className="text-gray-600 text-13">A brief description of the product goes here.</p>
        <div className="flex items-center justify-between">
          <span className="text-16 font-semibold">$99.99</span>
          <button className="bg-blue-500 hover:bg-blue-600 rounded-sm px-4 py-2 text-on-color">Add to Cart</button>
        </div>
      </>
    ),
  },
};

export const UserCard: Story = {
  args: {
    variant: ECardVariant.WITH_SHADOW,
    spacing: ECardSpacing.LG,
    direction: ECardDirection.ROW,
    children: (
      <>
        <div className="bg-blue-500 h-16 w-16 flex-shrink-0 rounded-full" />
        <div className="flex-1">
          <h3 className="text-16 font-semibold">John Doe</h3>
          <p className="text-gray-600 text-13">Software Engineer</p>
          <p className="text-gray-500 text-11">john.doe@example.com</p>
        </div>
      </>
    ),
  },
};

export const NotificationCard: Story = {
  args: {
    variant: ECardVariant.WITHOUT_SHADOW,
    spacing: ECardSpacing.SM,
    direction: ECardDirection.COLUMN,
    children: (
      <>
        <div className="flex items-start justify-between">
          <h4 className="font-semibold">New Message</h4>
          <span className="text-gray-500 text-11">2m ago</span>
        </div>
        <p className="text-gray-600 text-13">You have received a new message from Alice.</p>
      </>
    ),
  },
};

export const AllVariants: Story = {
  render() {
    return (
      <div className="space-y-4">
        <Card variant={ECardVariant.WITH_SHADOW}>
          <h3 className="font-semibold">With Shadow</h3>
          <p className="text-gray-600 text-13">Hover to see the shadow effect</p>
        </Card>
        <Card variant={ECardVariant.WITHOUT_SHADOW}>
          <h3 className="font-semibold">Without Shadow</h3>
          <p className="text-gray-600 text-13">No shadow on hover</p>
        </Card>
      </div>
    );
  },
};

export const AllSpacings: Story = {
  render() {
    return (
      <div className="space-y-4">
        <Card spacing={ECardSpacing.SM}>
          <h3 className="font-semibold">Small Spacing (p-4)</h3>
          <p className="text-gray-600 text-13">Compact padding</p>
        </Card>
        <Card spacing={ECardSpacing.LG}>
          <h3 className="font-semibold">Large Spacing (p-6)</h3>
          <p className="text-gray-600 text-13">More generous padding</p>
        </Card>
      </div>
    );
  },
};

export const AllDirections: Story = {
  render() {
    return (
      <div className="space-y-4">
        <Card direction={ECardDirection.COLUMN}>
          <h3 className="font-semibold">Column Direction</h3>
          <p className="text-gray-600 text-13">Vertical layout</p>
          <button className="bg-blue-500 w-fit rounded-sm px-4 py-2 text-on-color">Button</button>
        </Card>
        <Card direction={ECardDirection.ROW}>
          <div className="bg-blue-500 h-12 w-12 flex-shrink-0 rounded-sm" />
          <div>
            <h3 className="font-semibold">Row Direction</h3>
            <p className="text-gray-600 text-13">Horizontal layout</p>
          </div>
        </Card>
      </div>
    );
  },
};
