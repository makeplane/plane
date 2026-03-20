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

import type { Meta, StoryObj } from "@storybook/react-vite";

const Introduction = () => (
  <div className="flex flex-col gap-4 p-8">
    <h1 className="text-2xl font-bold text-primary">@plane/blocks</h1>
    <p className="text-secondary">
      Domain-specific component library built on <code>@plane/propel</code> primitives.
    </p>
  </div>
);

const meta = {
  title: "Introduction",
  component: Introduction,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Introduction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
