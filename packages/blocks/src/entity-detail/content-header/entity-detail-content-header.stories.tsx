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
import { EntityDetailContentHeader } from "./entity-detail-content-header";
import { MOCK_WORK_ITEM } from "../_mock-data";

const meta = preview.meta({
  title: "EntityDetail/ContentHeader",
  component: EntityDetailContentHeader,
  parameters: { layout: "padded" },
});

export const Default = meta.story({
  args: {
    breadcrumb: {
      parentElement: (
        <span className="text-body-xs-medium text-secondary hover:underline cursor-pointer">
          {MOCK_WORK_ITEM.parentTitle}
        </span>
      ),
      identifierElement: <span className="text-body-xs-medium text-primary">{MOCK_WORK_ITEM.identifier}</span>,
    },
    titleElement: <h2 className="text-h3-semibold text-primary leading-tight">{MOCK_WORK_ITEM.title}</h2>,
  },
});

export const WithCustomSeparator = meta.story({
  args: {
    breadcrumb: {
      parentElement: <span className="text-body-xs-medium text-secondary">Parent initiative</span>,
      identifierElement: <span className="text-body-xs-medium text-primary">ACME-108</span>,
      separator: <span className="text-tertiary">/</span>,
    },
    titleElement: <h2 className="text-h3-semibold text-primary leading-tight">Fix pagination on dashboard</h2>,
  },
});
