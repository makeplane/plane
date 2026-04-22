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
import { EntityDetailSidebarGroup } from "./entity-detail-sidebar-group";

const meta = preview.meta({
  title: "EntityDetail/SidebarGroup",
  component: EntityDetailSidebarGroup,
  parameters: { layout: "centered" },
});

export const DefaultOpen = meta.story({
  render: function Render() {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <div className="w-72">
        <EntityDetailSidebarGroup label="Details" isOpen={isOpen} onToggle={() => setIsOpen((o) => !o)}>
          <div className="flex flex-col gap-2">
            <div className="h-8 rounded bg-layer-3 w-full" />
            <div className="h-8 rounded bg-layer-3 w-full" />
            <div className="h-8 rounded bg-layer-3 w-full" />
          </div>
        </EntityDetailSidebarGroup>
      </div>
    );
  },
});

export const Closed = meta.story({
  render: function Render() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="w-72">
        <EntityDetailSidebarGroup label="Details" isOpen={isOpen} onToggle={() => setIsOpen((o) => !o)}>
          <div className="flex flex-col gap-2">
            <div className="h-8 rounded bg-layer-3 w-full" />
            <div className="h-8 rounded bg-layer-3 w-full" />
          </div>
        </EntityDetailSidebarGroup>
      </div>
    );
  },
});

export const MultipleSections = meta.story({
  render: function Render() {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
      details: true,
      project: false,
      custom: true,
    });

    const toggle = (key: string) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

    return (
      <div className="w-72 flex flex-col gap-4">
        <EntityDetailSidebarGroup label="Details" isOpen={openSections.details} onToggle={() => toggle("details")}>
          <div className="h-8 rounded bg-layer-3 w-full" />
        </EntityDetailSidebarGroup>
        <EntityDetailSidebarGroup
          label="Project structure"
          isOpen={openSections.project}
          onToggle={() => toggle("project")}
        >
          <div className="h-8 rounded bg-layer-3 w-full" />
        </EntityDetailSidebarGroup>
        <EntityDetailSidebarGroup
          label="Custom properties"
          isOpen={openSections.custom}
          onToggle={() => toggle("custom")}
        >
          <div className="h-8 rounded bg-layer-3 w-full" />
        </EntityDetailSidebarGroup>
      </div>
    );
  },
});

export const Uncontrolled = meta.story({
  render: () => (
    <div className="w-72 flex flex-col gap-4">
      <EntityDetailSidebarGroup label="Open by default" defaultOpen>
        <div className="flex flex-col gap-2">
          <div className="h-8 rounded bg-layer-3 w-full" />
          <div className="h-8 rounded bg-layer-3 w-full" />
        </div>
      </EntityDetailSidebarGroup>
      <EntityDetailSidebarGroup label="Closed by default" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <div className="h-8 rounded bg-layer-3 w-full" />
          <div className="h-8 rounded bg-layer-3 w-full" />
        </div>
      </EntityDetailSidebarGroup>
    </div>
  ),
});
