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
import { EntityDetailDivider } from "./entity-detail-divider";

const meta = preview.meta({
  title: "EntityDetail/Divider",
  component: EntityDetailDivider,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="flex w-96 flex-col gap-0">
        <p className="py-3 text-sm text-secondary">Section above the divider</p>
        <Story />
        <p className="py-3 text-sm text-secondary">Section below the divider</p>
      </div>
    ),
  ],
});

export const Default = meta.story({
  args: {},
});

export const CustomClass = meta.story({
  args: {
    className: "my-4",
  },
});
