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
  ModuleIcon,
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
  SpreadsheetLinkColumn,
  SpreadsheetPriorityColumn,
  SpreadsheetStartDateColumn,
  SpreadsheetStateColumn,
  SpreadsheetSubIssueColumn,
  SpreadsheetUpdatedOnColumn,
} from "@/components/issues/issue-layouts/table/columns";
// lib
import { store } from "@/lib/store-context";

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

export const SpreadSheetPropertyIconMap: Record<string, FC<ISvgIcons>> = {
  MembersPropertyIcon: MembersPropertyIcon,
  CalenderDays: CalendarDays,
  DueDatePropertyIcon: DueDatePropertyIcon,
  EstimatePropertyIcon: EstimatePropertyIcon,
  LabelPropertyIcon: LabelPropertyIcon,
  ModuleIcon: ModuleIcon,
  ContrastIcon: CycleIcon,
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
export function SpreadSheetPropertyIcon(props: ISvgIcons & { iconKey: string }) {
  const { iconKey } = props;
  const Icon = SpreadSheetPropertyIconMap[iconKey];
  if (!Icon) return null;
  return <Icon {...props} />;
}

export const SPREADSHEET_COLUMNS: { [key in keyof IIssueDisplayProperties]: TSpreadsheetColumn } = {
  assignee: SpreadsheetAssigneeColumn,
  created_on: SpreadsheetCreatedOnColumn,
  due_date: SpreadsheetDueDateColumn,
  estimate: SpreadsheetEstimateColumn,
  labels: SpreadsheetLabelColumn,
  modules: SpreadsheetModuleColumn,
  cycle: SpreadsheetCycleColumn,
  link: SpreadsheetLinkColumn,
  priority: SpreadsheetPriorityColumn,
  start_date: SpreadsheetStartDateColumn,
  state: SpreadsheetStateColumn,
  sub_issue_count: SpreadsheetSubIssueColumn,
  updated_on: SpreadsheetUpdatedOnColumn,
  attachment_count: SpreadsheetAttachmentColumn,
  customer_count: SpreadsheetCustomerColumn,
  customer_request_count: SpreadSheetCustomerRequestColumn,
};
