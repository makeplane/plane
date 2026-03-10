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

import { Card, ECardVariant, ECardSpacing, ECardDirection } from "./card";

const meta = preview.meta({
  title: "Data Display/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  args: {
    children: (
      <>
        <h3 className="text-16 font-semibold">Card Title</h3>
        <p className="text-13 text-gray-600">This is a default card with shadow and large spacing.</p>
      </>
    ),
  },
});

export const Default = meta.story({});

export const WithShadow = meta.story({
  args: {
    variant: ECardVariant.WITH_SHADOW,
    children: (
      <>
        <h3 className="text-16 font-semibold">Card with Shadow</h3>
        <p className="text-13 text-gray-600">Hover over this card to see the shadow effect.</p>
      </>
    ),
  },
});

export const WithoutShadow = meta.story({
  args: {
    variant: ECardVariant.WITHOUT_SHADOW,
    children: (
      <>
        <h3 className="text-16 font-semibold">Card without Shadow</h3>
        <p className="text-13 text-gray-600">This card has no shadow effect on hover.</p>
      </>
    ),
  },
});

export const SmallSpacing = meta.story({
  args: {
    spacing: ECardSpacing.SM,
    children: (
      <>
        <h3 className="text-16 font-semibold">Small Spacing</h3>
        <p className="text-13 text-gray-600">This card uses small spacing (p-4).</p>
      </>
    ),
  },
});

export const LargeSpacing = meta.story({
  args: {
    spacing: ECardSpacing.LG,
    children: (
      <>
        <h3 className="text-16 font-semibold">Large Spacing</h3>
        <p className="text-13 text-gray-600">This card uses large spacing (p-6).</p>
      </>
    ),
  },
});

export const ColumnDirection = meta.story({
  args: {
    direction: ECardDirection.COLUMN,
    children: (
      <>
        <h3 className="text-16 font-semibold">Column Direction</h3>
        <p className="text-13 text-gray-600">Content is arranged vertically.</p>
        <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color">Action</button>
      </>
    ),
  },
});

export const RowDirection = meta.story({
  args: {
    direction: ECardDirection.ROW,
    children: (
      <>
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-sm bg-blue-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-16 font-semibold">Row Direction</h3>
          <p className="text-13 text-gray-600">Content is arranged horizontally.</p>
        </div>
      </>
    ),
  },
});

export const ProductCard = meta.story({
  args: {
    variant: ECardVariant.WITH_SHADOW,
    spacing: ECardSpacing.LG,
    direction: ECardDirection.COLUMN,
    children: (
      <>
        <div className="h-48 w-full rounded-sm bg-gray-200" />
        <h3 className="text-18 font-bold">Product Name</h3>
        <p className="text-13 text-gray-600">A brief description of the product goes here.</p>
        <div className="flex items-center justify-between">
          <span className="text-16 font-semibold">$99.99</span>
          <button className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600">Add to Cart</button>
        </div>
      </>
    ),
  },
});

export const UserCard = meta.story({
  args: {
    variant: ECardVariant.WITH_SHADOW,
    spacing: ECardSpacing.LG,
    direction: ECardDirection.ROW,
    children: (
      <>
        <div className="h-16 w-16 flex-shrink-0 rounded-full bg-blue-500" />
        <div className="flex-1">
          <h3 className="text-16 font-semibold">John Doe</h3>
          <p className="text-13 text-gray-600">Software Engineer</p>
          <p className="text-11 text-gray-500">john.doe@example.com</p>
        </div>
      </>
    ),
  },
});

export const NotificationCard = meta.story({
  args: {
    variant: ECardVariant.WITHOUT_SHADOW,
    spacing: ECardSpacing.SM,
    direction: ECardDirection.COLUMN,
    children: (
      <>
        <div className="flex items-start justify-between">
          <h4 className="font-semibold">New Message</h4>
          <span className="text-11 text-gray-500">2m ago</span>
        </div>
        <p className="text-13 text-gray-600">You have received a new message from Alice.</p>
      </>
    ),
  },
});
