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
import { EntityDetailLayout } from "./entity-detail-layout";

const MainContent = () => (
  <div className="flex flex-col gap-4 p-4">
    <h2 className="text-lg font-semibold">Main Content Area</h2>
    <p className="text-secondary">
      This is the main content area where the work item description, activity feed, and other primary content would
      appear.
    </p>
    <div className="h-64 rounded-lg border border-subtle bg-surface-2 p-4">Placeholder content block</div>
  </div>
);

const SidebarContent = () => (
  <div className="flex flex-col gap-3 p-4">
    <h3 className="text-sm font-medium">Sidebar</h3>
    <div className="h-8 rounded bg-surface-2" />
    <div className="h-8 rounded bg-surface-2" />
    <div className="h-8 rounded bg-surface-2" />
    <div className="h-8 rounded bg-surface-2" />
  </div>
);

const HeaderElement = () => (
  <div className="border-b border-subtle px-4 py-2">
    <span className="text-sm text-secondary">Header area</span>
  </div>
);

const meta = preview.meta({
  title: "EntityDetail/Layout",
  component: EntityDetailLayout,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ height: "600px", width: "100%" }}>
        <Story />
      </div>
    ),
  ],
});

export const Default = meta.story({
  args: {
    mainContent: <MainContent />,
    sidebarContent: <SidebarContent />,
  },
});

export const WithHeader = meta.story({
  args: {
    mainContent: <MainContent />,
    sidebarContent: <SidebarContent />,
    headerElement: <HeaderElement />,
  },
});

export const SidebarClosed = meta.story({
  args: {
    mainContent: <MainContent />,
    sidebarContent: <SidebarContent />,
    isSidebarOpen: false,
  },
});
