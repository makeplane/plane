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
import { EntityDetailSidebarPanel } from "./entity-detail-sidebar-panel";

const meta = preview.meta({
  title: "EntityDetail/SidebarPanel",
  component: EntityDetailSidebarPanel,
  parameters: { layout: "centered" },
});

export const Default = meta.story({
  args: {
    title: "Properties",
    subtitle: "Updated 3d ago",
    children: (
      <div className="flex flex-col gap-3">
        <div className="h-8 rounded bg-layer-3 w-full" />
        <div className="h-8 rounded bg-layer-3 w-full" />
        <div className="h-8 rounded bg-layer-3 w-full" />
      </div>
    ),
  },
});

export const WithSubtitleTooltip = meta.story({
  args: {
    title: "Properties",
    subtitle: "Updated 3d ago",
    subtitleTooltip: (
      <span className="text-caption-sm-regular text-tertiary cursor-help" title="March 20, 2026 at 10:30 AM">
        i
      </span>
    ),
    children: (
      <div className="flex flex-col gap-3">
        <div className="h-8 rounded bg-layer-3 w-full" />
        <div className="h-8 rounded bg-layer-3 w-full" />
      </div>
    ),
  },
});

export const TitleOnly = meta.story({
  args: {
    title: "Details",
    children: (
      <div className="flex flex-col gap-3">
        <div className="h-8 rounded bg-layer-3 w-full" />
      </div>
    ),
  },
});
