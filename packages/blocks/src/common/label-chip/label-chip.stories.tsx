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
import { LabelChip } from "./label-chip";

const meta = preview.meta({
  title: "Common/LabelChip",
  component: LabelChip,
  parameters: { layout: "centered" },
});

export const Default = meta.story({
  args: {
    name: "Bug",
    color: "#ef4444",
  },
});

export const NoColor = meta.story({
  args: {
    name: "Enhancement",
  },
});

export const LongName = meta.story({
  args: {
    name: "Very Long Label Name That Should Truncate",
    color: "#3b82f6",
  },
});
