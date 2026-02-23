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
import { CustomRadarAxisTick } from "./tick";

const meta = preview.meta({
  component: CustomRadarAxisTick,
  parameters: {
    layout: "padded",
  },
  args: {
    x: 100,
    y: 50,
    cx: 100,
    cy: 100,
    payload: { value: "Design" },
  },
  decorators: [
    (Story) => (
      <svg width={200} height={200}>
        <Story />
      </svg>
    ),
  ],
});

export const Default = meta.story({});

export const WithLabel = meta.story({
  args: {
    payload: { value: "dev" },
    getLabel: (v: string) => v.toUpperCase(),
    offset: 20,
  },
});
