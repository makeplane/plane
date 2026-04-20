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

import type { FC } from "react";
import { CalendarDays, LayersIcon, Paperclip } from "lucide-react";
// plane imports
import type { ISvgIcons } from "@plane/propel/icons";
import {
  CycleIcon,
  DiceIcon,
  ModuleIcon,
  ReleaseIcon,
  CustomerRequestIcon,
  CustomersIcon,
  LinkIcon,
  StatePropertyIcon,
  MembersPropertyIcon,
  DueDatePropertyIcon,
  EstimatePropertyIcon,
  LabelPropertyIcon,
  PriorityPropertyIcon,
  StartDatePropertyIcon,
} from "@plane/propel/icons";
import type { IIssueDisplayProperties, TSpreadsheetColumn } from "@plane/types";
import { clone } from "lodash-es";
// components
import {
  SpreadsheetCustomerColumn,
  SpreadSheetCustomerRequestColumn,
  SpreadsheetAssigneeColumn,
  SpreadsheetAttachmentColumn,
  SpreadsheetCreatedOnColumn,
  SpreadsheetDueDateColumn,
  SpreadsheetEstimateColumn,
  SpreadsheetLabelColumn,
  SpreadsheetModuleColumn,
  SpreadsheetCycleColumn,
  SpreadsheetReleaseColumn,
  SpreadsheetLinkColumn,
  SpreadsheetPriorityColumn,
  SpreadsheetStartDateColumn,
  SpreadsheetStateColumn,
  SpreadsheetSubIssueColumn,
  SpreadsheetUpdatedOnColumn,
} from "@/components/issues/issue-layouts/table/columns";
// lib
import { store } from "@/lib/store-context";
import type { TWorkItemProperty } from "@/store/work-items/permissions/root";

export const shouldRenderWorkItemPropertyColumn = (key: string): boolean => {
  const isEstimateEnabled = store.projectRoot.project.currentProjectDetails?.estimate !== null;
  const isCustomersFeatureEnabled = store.customersStore.isCustomersFeatureEnabled;
  switch (key) {
    case "estimate":
      return isEstimateEnabled;
    case "customer_count":
      return !!isCustomersFeatureEnabled;
    case "customer_request_count":
      return !!isCustomersFeatureEnabled;
    default:
      return true;
  }
};

export const getDisplayPropertiesCount = (
  displayProperties: IIssueDisplayProperties,
  ignoreFields?: (keyof IIssueDisplayProperties)[]
) => {
  const propertyKeys = Object.keys(displayProperties) as (keyof IIssueDisplayProperties)[];

  let count = 0;

  for (const propertyKey of propertyKeys) {
    if (ignoreFields && ignoreFields.includes(propertyKey)) continue;
    if (displayProperties[propertyKey]) count++;
  }

  return count;
};

/**
 * Returns approximate height of Kanban card based on display properties
 * @param displayProperties
 * @returns
 */
export function getApproximateCardHeight(displayProperties: IIssueDisplayProperties | undefined) {
  if (!displayProperties) return 100;

  // default card height
  let cardHeight = 46;

  const clonedProperties = clone(displayProperties);

  // key adds the height for key
  if (clonedProperties.key) {
    cardHeight += 24;
  }

  // Ignore smaller dimension properties
  const ignoredProperties: (keyof IIssueDisplayProperties)[] = [
    "key",
    "sub_issue_count",
    "link",
    "attachment_count",
    "created_on",
    "updated_on",
  ];

  ignoredProperties.forEach((key: keyof IIssueDisplayProperties) => {
    delete clonedProperties[key];
  });

  let propertyCount = 0;

  // count the remaining properties
  (Object.keys(clonedProperties) as (keyof IIssueDisplayProperties)[]).forEach((key: keyof IIssueDisplayProperties) => {
    if (clonedProperties[key]) {
      propertyCount++;
    }
  });

  // based on property count, approximate the height of each card
  if (propertyCount > 3) {
    cardHeight += 60;
  } else if (propertyCount > 0) {
    cardHeight += 32;
  }

  return cardHeight;
}

export type TSpreadsheetPropertyIconKey =
  | "MembersPropertyIcon"
  | "CalendarDays"
  | "DueDatePropertyIcon"
  | "EstimatePropertyIcon"
  | "LabelPropertyIcon"
  | "DiceIcon"
  | "ModuleIcon"
  | "ContrastIcon"
  | "ReleaseIcon"
  | "PriorityPropertyIcon"
  | "StartDatePropertyIcon"
  | "StatePropertyIcon"
  | "Link2"
  | "Paperclip"
  | "LayersIcon"
  | "CustomersIcon"
  | "CustomerRequestIcon";

export const SpreadSheetPropertyIconMap: Record<TSpreadsheetPropertyIconKey, FC<ISvgIcons>> = {
  MembersPropertyIcon: MembersPropertyIcon,
  CalendarDays: CalendarDays,
  DueDatePropertyIcon: DueDatePropertyIcon,
  EstimatePropertyIcon: EstimatePropertyIcon,
  LabelPropertyIcon: LabelPropertyIcon,
  DiceIcon: DiceIcon,
  ModuleIcon: ModuleIcon,
  ContrastIcon: CycleIcon,
  ReleaseIcon: ReleaseIcon,
  PriorityPropertyIcon: PriorityPropertyIcon,
  StartDatePropertyIcon: StartDatePropertyIcon,
  StatePropertyIcon: StatePropertyIcon,
  Link2: LinkIcon,
  Paperclip: Paperclip,
  LayersIcon: LayersIcon,
  CustomersIcon: CustomersIcon,
  CustomerRequestIcon: CustomerRequestIcon,
};

/**
 * This method returns the icon for Spreadsheet column headers
 * @param iconKey
 */
export function SpreadSheetPropertyIcon(props: ISvgIcons & { iconKey: TSpreadsheetPropertyIconKey }) {
  const { iconKey } = props;
  const Icon = SpreadSheetPropertyIconMap[iconKey];
  if (!Icon) return null;
  return <Icon {...props} />;
}

type SpreadsheetColumnDetails = {
  workItemProperty: TWorkItemProperty;
  component: TSpreadsheetColumn;
};

export const SPREADSHEET_COLUMNS: { [key in keyof IIssueDisplayProperties]: SpreadsheetColumnDetails } = {
  assignee: {
    workItemProperty: "assignee_ids",
    component: SpreadsheetAssigneeColumn,
  },
  created_on: {
    workItemProperty: "created_at",
    component: SpreadsheetCreatedOnColumn,
  },
  due_date: {
    workItemProperty: "target_date",
    component: SpreadsheetDueDateColumn,
  },
  estimate: {
    workItemProperty: "estimate_point",
    component: SpreadsheetEstimateColumn,
  },
  labels: {
    workItemProperty: "label_ids",
    component: SpreadsheetLabelColumn,
  },
  modules: {
    workItemProperty: "module_ids",
    component: SpreadsheetModuleColumn,
  },
  cycle: {
    workItemProperty: "cycle_id",
    component: SpreadsheetCycleColumn,
  },
  link: {
    workItemProperty: "link_count",
    component: SpreadsheetLinkColumn,
  },
  priority: {
    workItemProperty: "priority",
    component: SpreadsheetPriorityColumn,
  },
  start_date: {
    workItemProperty: "start_date",
    component: SpreadsheetStartDateColumn,
  },
  state: {
    workItemProperty: "state_id",
    component: SpreadsheetStateColumn,
  },
  sub_issue_count: {
    workItemProperty: "sub_issues_count",
    component: SpreadsheetSubIssueColumn,
  },
  updated_on: {
    workItemProperty: "updated_at",
    component: SpreadsheetUpdatedOnColumn,
  },
  attachment_count: {
    workItemProperty: "attachment_count",
    component: SpreadsheetAttachmentColumn,
  },
  customer_count: {
    workItemProperty: "customer_ids",
    component: SpreadsheetCustomerColumn,
  },
  customer_request_count: {
    workItemProperty: "customer_request_ids",
    component: SpreadSheetCustomerRequestColumn,
  },
  releases: {
    workItemProperty: "release_ids",
    component: SpreadsheetReleaseColumn,
  },
};
