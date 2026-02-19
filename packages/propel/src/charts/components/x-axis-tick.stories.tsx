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
import { CustomXAxisTick } from "./tick";

const meta = preview.meta({
  component: CustomXAxisTick,
  parameters: {
    layout: "padded",
  },
  args: {
    x: 100,
    y: 10,
    payload: { value: "Jan" },
  },
  decorators: [
    (Story) => (
      <svg width={200} height={50}>
        <Story />
      </svg>
    ),
  ],
});

export const Default = meta.story({});

export const WithLabel = meta.story({
  args: {
    payload: { value: "jan" },
    getLabel: (v: string) => v.toUpperCase(),
  },
});
