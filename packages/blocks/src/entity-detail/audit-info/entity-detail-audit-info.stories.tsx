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
import { CalendarPlus, CheckCircle, RefreshCw, UserCircle } from "lucide-react";
import { EntityDetailAuditInfo } from "./entity-detail-audit-info";
import { MOCK_AUDIT } from "../_mock-data";

const meta = preview.meta({
  title: "EntityDetail/AuditInfo",
  component: EntityDetailAuditInfo,
  parameters: { layout: "centered" },
});

export const Default = meta.story({
  args: {
    rows: [
      { icon: UserCircle, text: `Created by ${MOCK_AUDIT.createdBy}` },
      { icon: CalendarPlus, text: `Created on ${MOCK_AUDIT.createdOn}` },
      { icon: RefreshCw, text: `Updated on ${MOCK_AUDIT.updatedOn}` },
      { icon: CheckCircle, text: `Completed on ${MOCK_AUDIT.completedOn}` },
    ],
  },
});

export const CustomColors = meta.story({
  args: {
    rows: [
      { icon: UserCircle, text: `Created by ${MOCK_AUDIT.createdBy}` },
      { icon: CalendarPlus, text: `Created on ${MOCK_AUDIT.createdOn}` },
    ],
  },
});
