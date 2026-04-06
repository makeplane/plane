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
import { Plus } from "lucide-react";
import { EntityDetailWidgetSection } from "./entity-detail-widget-section";
import { MOCK_WIDGET_SECTIONS } from "../_mock-data";

const meta = preview.meta({
  title: "EntityDetail/WidgetSection",
  component: EntityDetailWidgetSection,
  parameters: { layout: "centered" },
});

export const DefaultOpen = meta.story({
  render: () => {
    const section = MOCK_WIDGET_SECTIONS[0];
    const [isOpen, setIsOpen] = useState(true);
    return (
      <div className="w-96">
        <EntityDetailWidgetSection
          title={section.title}
          count={section.count}
          isOpen={isOpen}
          onToggle={() => setIsOpen((prev) => !prev)}
        >
          <div className="text-body-sm-regular text-secondary p-2">Content placeholder for {section.title}</div>
        </EntityDetailWidgetSection>
      </div>
    );
  },
});

export const Closed = meta.story({
  render: () => {
    const section = MOCK_WIDGET_SECTIONS[3];
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="w-96">
        <EntityDetailWidgetSection
          title={section.title}
          count={section.count}
          isOpen={isOpen}
          onToggle={() => setIsOpen((prev) => !prev)}
        >
          <div className="text-body-sm-regular text-secondary p-2">Content placeholder for {section.title}</div>
        </EntityDetailWidgetSection>
      </div>
    );
  },
});

export const WithActionElement = meta.story({
  render: () => {
    const section = MOCK_WIDGET_SECTIONS[2];
    const [isOpen, setIsOpen] = useState(true);
    return (
      <div className="w-96">
        <EntityDetailWidgetSection
          title={section.title}
          count={section.count}
          isOpen={isOpen}
          onToggle={() => setIsOpen((prev) => !prev)}
          actionElement={
            <button type="button" className="p-1 rounded-md hover:bg-layer-transparent-hover text-secondary">
              <Plus className="size-3.5" />
            </button>
          }
        >
          <div className="text-body-sm-regular text-secondary p-2">Content placeholder for {section.title}</div>
        </EntityDetailWidgetSection>
      </div>
    );
  },
});
