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
import { NavigationTourArrow } from "./navigation-tour-arrow";

const meta = preview.meta({
  component: NavigationTourArrow,
  parameters: {
    layout: "centered",
  },
  args: {
    offset: 40,
    size: 8,
  },
});

export const Top = meta.story({
  args: { placement: "top" },
  decorators: [
    (Story) => (
      <div className="relative w-20 h-20 bg-zinc-900 rounded">
        <Story />
        <span className="absolute inset-0 flex items-center justify-center text-on-color text-11">top</span>
      </div>
    ),
  ],
});

export const Bottom = meta.story({
  args: { placement: "bottom" },
  decorators: [
    (Story) => (
      <div className="relative w-20 h-20 bg-zinc-900 rounded">
        <Story />
        <span className="absolute inset-0 flex items-center justify-center text-on-color text-11">bottom</span>
      </div>
    ),
  ],
});

export const Left = meta.story({
  args: { placement: "left" },
  decorators: [
    (Story) => (
      <div className="relative w-20 h-20 bg-zinc-900 rounded">
        <Story />
        <span className="absolute inset-0 flex items-center justify-center text-on-color text-11">left</span>
      </div>
    ),
  ],
});

export const Right = meta.story({
  args: { placement: "right" },
  decorators: [
    (Story) => (
      <div className="relative w-20 h-20 bg-zinc-900 rounded">
        <Story />
        <span className="absolute inset-0 flex items-center justify-center text-on-color text-11">right</span>
      </div>
    ),
  ],
});

export const AllPlacements = meta.story({
  render() {
    return (
      <div className="flex gap-12 items-center p-8">
        <div className="relative w-20 h-20 bg-zinc-900 rounded">
          <NavigationTourArrow placement="top" offset={40} size={8} />
          <span className="absolute inset-0 flex items-center justify-center text-on-color text-11">top</span>
        </div>
        <div className="relative w-20 h-20 bg-zinc-900 rounded">
          <NavigationTourArrow placement="bottom" offset={40} size={8} />
          <span className="absolute inset-0 flex items-center justify-center text-on-color text-11">bottom</span>
        </div>
        <div className="relative w-20 h-20 bg-zinc-900 rounded">
          <NavigationTourArrow placement="left" offset={40} size={8} />
          <span className="absolute inset-0 flex items-center justify-center text-on-color text-11">left</span>
        </div>
        <div className="relative w-20 h-20 bg-zinc-900 rounded">
          <NavigationTourArrow placement="right" offset={40} size={8} />
          <span className="absolute inset-0 flex items-center justify-center text-on-color text-11">right</span>
        </div>
      </div>
    );
  },
});
