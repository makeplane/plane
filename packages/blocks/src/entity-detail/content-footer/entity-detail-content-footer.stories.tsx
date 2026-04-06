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
import { EntityDetailContentFooter } from "./entity-detail-content-footer";
import { MOCK_LAST_EDITED } from "../_mock-data";

const meta = preview.meta({
  title: "EntityDetail/ContentFooter",
  component: EntityDetailContentFooter,
  parameters: { layout: "padded" },
});

export const Default = meta.story({
  args: {
    leftElement: (
      <div className="flex items-center gap-1">
        <span className="rounded-md bg-layer-3 px-1.5 py-1 text-caption-md-regular text-secondary">Reactions area</span>
      </div>
    ),
    rightElement: (
      <span className="text-caption-md-regular text-placeholder">
        Last edited by {MOCK_LAST_EDITED.name} &middot; {MOCK_LAST_EDITED.timeAgo}
      </span>
    ),
  },
});

export const LeftOnly = meta.story({
  args: {
    leftElement: (
      <div className="flex items-center gap-1">
        <span className="rounded-md bg-layer-3 px-1.5 py-1 text-caption-md-regular text-secondary">Reactions area</span>
      </div>
    ),
  },
});

export const RightOnly = meta.story({
  args: {
    rightElement: (
      <span className="text-caption-md-regular text-placeholder">
        Last edited by {MOCK_LAST_EDITED.name} &middot; {MOCK_LAST_EDITED.timeAgo}
      </span>
    ),
  },
});
