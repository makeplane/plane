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

import { Separator } from "./separator";

const meta = preview.meta({
  title: "Primitives/Separator",
  component: Separator,
  parameters: {
    layout: "centered",
  },
});

export const Default = meta.story({
  render(_args) {
    return (
      <div className="w-[300px] space-y-4">
        <div>Content Above</div>
        <Separator />
        <div>Content Below</div>
      </div>
    );
  },
});

export const Vertical = meta.story({
  render(_args) {
    return (
      <div className="flex h-[100px] items-center space-x-4">
        <div>Left Content</div>
        <Separator orientation="vertical" />
        <div>Right Content</div>
      </div>
    );
  },
});

export const WithinContainer = meta.story({
  render(_args) {
    return (
      <div className="w-[300px] rounded-lg border p-6 space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Section 1</h4>
          <p className="text-13 text-muted-foreground">Description for section 1</p>
        </div>
        <Separator />
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Section 2</h4>
          <p className="text-13 text-muted-foreground">Description for section 2</p>
        </div>
      </div>
    );
  },
});
