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

import { useState } from "react";
import preview from "#.storybook/preview";
import { Clock, Filter, SlidersHorizontal } from "lucide-react";
import { IconButton } from "@plane/propel/icon-button";
import { Button } from "@plane/propel/button";
import { ActivityHeader } from "./activity-header";

const meta = preview.meta({
  title: "Activity/ActivityHeader",
  component: ActivityHeader,
  parameters: { layout: "centered" },
});

const defaultTabs = [
  { key: "all", label: "All" },
  { key: "activity", label: "Activity" },
  { key: "comment", label: "Comment" },
  { key: "worklog", label: "Worklog" },
  { key: "transition", label: "Transition" },
  { key: "history", label: "History" },
];

const InteractiveHeader = (props: { initialTab: string; args: Record<string, unknown> }) => {
  const [activeTab, setActiveTab] = useState(props.initialTab);
  return <ActivityHeader {...(props.args as any)} activeTab={activeTab} onTabChange={setActiveTab} />;
};

export const Default = meta.story({
  args: {
    tabs: defaultTabs,
    activeTab: "all",
    onTabChange: () => {},
  },
  render: (args) => (
    <div className="w-[821px] bg-surface-1 p-4">
      <InteractiveHeader initialTab="all" args={args} />
    </div>
  ),
});

export const WithActions = meta.story({
  args: {
    tabs: defaultTabs,
    activeTab: "worklog",
    onTabChange: () => {},
    actionsElement: (
      <div className="flex items-center gap-2">
        <Button variant="tertiary" size="base" prependIcon={<Clock className="size-3.5" />} onClick={() => {}}>
          Add log
        </Button>
        <IconButton variant="tertiary" size="base" icon={Filter} onClick={() => {}} />
        <IconButton variant="tertiary" size="base" icon={SlidersHorizontal} onClick={() => {}} />
      </div>
    ),
  },
  render: (args) => (
    <div className="w-[821px] bg-surface-1 p-4">
      <InteractiveHeader initialTab="worklog" args={args} />
    </div>
  ),
});

export const FewTabs = meta.story({
  args: {
    tabs: [
      { key: "all", label: "All" },
      { key: "activity", label: "Activity" },
      { key: "comment", label: "Comment" },
    ],
    activeTab: "all",
    onTabChange: () => {},
  },
  render: (args) => (
    <div className="w-[400px] bg-surface-1 p-4">
      <InteractiveHeader initialTab="all" args={args} />
    </div>
  ),
});
