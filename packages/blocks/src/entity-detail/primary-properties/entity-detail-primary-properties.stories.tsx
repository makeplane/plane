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
import { EntityDetailPrimaryProperties, PropertyDivider } from "./entity-detail-primary-properties";
import { MOCK_STATE, MOCK_PRIORITY, MOCK_ASSIGNEES, MOCK_DATES } from "../_mock-data";

const meta = preview.meta({
  title: "EntityDetail/PrimaryProperties",
  component: EntityDetailPrimaryProperties,
  parameters: { layout: "padded" },
});

const PropertyPill = ({ label, color }: { label: string; color?: string }) => (
  <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-layer-transparent-hover">
    {color && <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: color }} />}
    <span className="text-body-xs-medium text-primary whitespace-nowrap">{label}</span>
  </div>
);

export const Default = meta.story({
  args: {
    children: (
      <>
        <PropertyPill label={MOCK_STATE.label} color={MOCK_STATE.color} />
        <PropertyDivider />
        <PropertyPill label={MOCK_PRIORITY.label} />
        <PropertyDivider />
        <PropertyPill label={MOCK_ASSIGNEES.map((a) => a.name).join(", ")} />
        <PropertyDivider />
        <PropertyPill label={MOCK_DATES.startDate} />
        <PropertyPill label={MOCK_DATES.dueDate} />
      </>
    ),
  },
});

export const WithMultipleDividers = meta.story({
  args: {
    children: (
      <>
        <PropertyPill label={MOCK_STATE.label} color={MOCK_STATE.color} />
        <PropertyPill label={MOCK_PRIORITY.label} />
        <PropertyDivider />
        <PropertyPill label={MOCK_ASSIGNEES[0].name} />
        <PropertyDivider />
        <PropertyPill label={MOCK_DATES.dueDate} />
        <PropertyPill label="Auth Module" />
      </>
    ),
  },
});
