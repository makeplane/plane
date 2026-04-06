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
import { Calendar, Signal, Tag, UserCircle } from "lucide-react";
import { Avatar, AvatarGroup } from "@plane/propel/avatar";
import { Button } from "@plane/propel/button";
import { LabelFilledIcon } from "@plane/propel/icons";
import { EntityDetailPropertyField } from "./entity-detail-property-field";
import { MOCK_DATES, MOCK_LABELS, MOCK_PRIORITY, MOCK_ASSIGNEES } from "../_mock-data";

const meta = preview.meta({
  title: "EntityDetail/PropertyField",
  component: EntityDetailPropertyField,
  parameters: { layout: "centered" },
});

export const Default = meta.story({
  args: {
    icon: Calendar,
    label: "Due date",
    children: <span className="text-body-xs-medium text-primary">{MOCK_DATES.dueDate}</span>,
  },
});

export const WithAppendElement = meta.story({
  args: {
    icon: UserCircle,
    label: "Assignees",
    appendElement: <span className="text-caption-sm-regular text-accent-strong">*</span>,
    children: <span className="text-body-xs-medium text-primary">{MOCK_ASSIGNEES[0].name}</span>,
  },
});

export const MultipleRows = meta.story({
  render: () => (
    <div className="w-80 flex flex-col gap-2">
      <EntityDetailPropertyField icon={Signal} label="Priority">
        <span className="text-body-xs-medium text-primary">{MOCK_PRIORITY.label}</span>
      </EntityDetailPropertyField>
      <EntityDetailPropertyField icon={UserCircle} label="Assignees">
        <AvatarGroup max={3} size="sm">
          {MOCK_ASSIGNEES.map((a) => (
            <Avatar key={a.id} name={a.name} src={a.avatarUrl} fallbackBackgroundColor={a.fallbackColor} size="sm" />
          ))}
        </AvatarGroup>
        <span className="text-body-xs-medium text-primary">{MOCK_ASSIGNEES.map((a) => a.name).join(", ")}</span>
      </EntityDetailPropertyField>
      <EntityDetailPropertyField icon={Tag} label="Labels">
        {MOCK_LABELS.map((l) => (
          <Button key={l.id} variant="tertiary" size="base" prependIcon={<LabelFilledIcon color={l.color} />}>
            {l.name}
          </Button>
        ))}
      </EntityDetailPropertyField>
    </div>
  ),
});
