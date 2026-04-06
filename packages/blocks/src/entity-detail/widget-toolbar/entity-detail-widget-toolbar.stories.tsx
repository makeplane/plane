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
import { FilePlus, GitBranch, Link, Paperclip, SquareStack } from "lucide-react";
import { EntityDetailWidgetToolbar } from "./entity-detail-widget-toolbar";

const meta = preview.meta({
  title: "EntityDetail/WidgetToolbar",
  component: EntityDetailWidgetToolbar,
  parameters: { layout: "centered" },
});

export const Default = meta.story({
  render: () => (
    <EntityDetailWidgetToolbar>
      <EntityDetailWidgetToolbar.Section>
        <EntityDetailWidgetToolbar.TextButton icon={<SquareStack className="size-4" />} label="Sub-work item" />
      </EntityDetailWidgetToolbar.Section>
      <EntityDetailWidgetToolbar.Section>
        <EntityDetailWidgetToolbar.DropdownButton icon={<GitBranch className="size-4" />} ariaLabel="Dependencies" />
        <EntityDetailWidgetToolbar.DropdownButton icon={<Link className="size-4" />} ariaLabel="Relations" />
      </EntityDetailWidgetToolbar.Section>
      <EntityDetailWidgetToolbar.Section>
        <EntityDetailWidgetToolbar.IconButton icon={<Link className="size-4" />} ariaLabel="Links" />
        <EntityDetailWidgetToolbar.IconButton icon={<Paperclip className="size-4" />} ariaLabel="Attachments" />
      </EntityDetailWidgetToolbar.Section>
      <EntityDetailWidgetToolbar.Section>
        <EntityDetailWidgetToolbar.IconButton icon={<FilePlus className="size-4" />} ariaLabel="Pages" />
      </EntityDetailWidgetToolbar.Section>
    </EntityDetailWidgetToolbar>
  ),
});
