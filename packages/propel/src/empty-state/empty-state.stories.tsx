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
import { EmptyState } from "./empty-state";

const meta = preview.meta({
  title: "Feedback/Empty State",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
});

export const DetailedType = meta.story({
  args: {
    type: "detailed",
    title: "No items found",
    description: "Create your first item to get started.",
  },
});

export const SimpleType = meta.story({
  args: {
    type: "simple",
    title: "No results",
    description: "Try adjusting your search.",
  },
});

export const SimpleWithDescriptionOnly = meta.story({
  args: {
    type: "simple",
    description: "Nothing here yet",
  },
});

export const WithCustomAsset = meta.story({
  args: {
    type: "detailed",
    title: "Empty",
    description: "No data available",
    asset: <div data-testid="custom-asset" className="w-20 h-20 bg-gray-200 rounded" />,
  },
});
