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

import type { TInitiativeDisplayFilters, TInitiativeStates } from "@plane/types";

export enum EInitiativeNavigationItem {
  OVERVIEW = "overview",
  SCOPE = "scope",
}

export const INITIATIVE_DEFAULT_DISPLAY_FILTERS: TInitiativeDisplayFilters = {
  layout: "list",
  group_by: "lead",
  order_by: "-created_at",
};

export const INITIATIVE_STATES = {
  DRAFT: {
    key: "DRAFT",
    title: "Drafts",
    color: "#60646c",
    defaultStateName: "Draft",
    sortOrder: 1,
  },
  PLANNED: {
    key: "PLANNED",
    title: "Planned",
    color: "#60646C",
    defaultStateName: "Planned",
    sortOrder: 2,
  },
  ACTIVE: {
    key: "ACTIVE",
    title: "Active",
    color: "#F59E0B",
    defaultStateName: "Active",
    sortOrder: 3,
  },
  COMPLETED: {
    key: "COMPLETED",
    title: "Completed",
    color: "#46A758",
    defaultStateName: "Completed",
    sortOrder: 4,
  },
  CLOSED: {
    key: "CLOSED",
    title: "Closed",
    color: "#9AA4BC",
    defaultStateName: "Closed",
    sortOrder: 5,
  },
} satisfies Record<
  TInitiativeStates,
  {
    key: TInitiativeStates;
    title: string;
    color: string;
    defaultStateName: string;
    sortOrder: number;
  }
>;

export const ARCHIVABLE_INITIATIVE_STATES: TInitiativeStates[] = ["COMPLETED", "CLOSED"];

export const INITIATIVE_ERROR_DETAILS: Record<string, { i18n_message: string }> = {
  INITIATIVE_CANNOT_BE_ARCHIVED_IN_THIS_STATE: {
    i18n_message: "initiatives.toast.archive.initiative_cannot_be_archived_in_this_state",
  },
};
