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
import { ActivityFeed } from "./activity-feed";

const TABS = [
  { key: "all", label: "All" },
  { key: "activity", label: "Activity" },
  { key: "comments", label: "Comments" },
];

const meta = preview.meta({
  title: "Activity/ActivityFeed",
  component: ActivityFeed,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-[757px] bg-surface-1 p-4">
        <Story />
      </div>
    ),
  ],
});

export const Default = meta.story({
  args: {
    tabs: TABS,
    activeTab: "all",
    onTabChange: () => {},
    children: <div className="p-4 text-secondary">Activity content goes here</div>,
  },
});

export const WithActions = meta.story({
  args: {
    tabs: TABS,
    activeTab: "all",
    onTabChange: () => {},
    actionsElement: (
      <div className="flex items-center gap-2">
        <button type="button" className="h-6 rounded-md bg-layer-3 px-2 text-body-xs-medium text-secondary">
          + Add log
        </button>
      </div>
    ),
    children: <div className="p-4 text-secondary">Activity content with header actions</div>,
  },
});

export const AllTabs = meta.story({
  args: {
    tabs: [
      { key: "all", label: "All" },
      { key: "activity", label: "Activity" },
      { key: "comments", label: "Comments" },
      { key: "worklog", label: "Worklog" },
      { key: "transition", label: "Transition" },
      { key: "history", label: "History" },
    ],
    activeTab: "all",
    onTabChange: () => {},
    children: <div className="p-4 text-secondary">Full tab set with children</div>,
  },
});
