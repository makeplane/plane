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

export type TInstanceUserOrderByOptions =
  | "display_name"
  | "-display_name"
  | "full_name"
  | "-full_name"
  | "email"
  | "-email"
  | "created_at"
  | "-created_at"
  | "workspace_count"
  | "-workspace_count"
  | "is_instance_admin"
  | "-is_instance_admin"
  | "is_active"
  | "-is_active";

export interface IInstanceUserDisplayProperties {
  full_name: boolean;
  display_name: boolean;
  email: boolean;
  account_type: boolean;
  created_at: boolean;
  status: boolean;
}

export const INSTANCE_USER_PROPERTY_DETAILS: {
  [key in keyof IInstanceUserDisplayProperties]: {
    title: string;
    ascendingOrderKey: TInstanceUserOrderByOptions;
    ascendingOrderTitle: string;
    descendingOrderKey: TInstanceUserOrderByOptions;
    descendingOrderTitle: string;
    isSortingAllowed: boolean;
  };
} = {
  full_name: {
    title: "Full Name",
    ascendingOrderKey: "full_name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-full_name",
    descendingOrderTitle: "Z",
    isSortingAllowed: true,
  },
  display_name: {
    title: "Display Name",
    ascendingOrderKey: "display_name",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-display_name",
    descendingOrderTitle: "Z",
    isSortingAllowed: true,
  },
  email: {
    title: "Email",
    ascendingOrderKey: "email",
    ascendingOrderTitle: "A",
    descendingOrderKey: "-email",
    descendingOrderTitle: "Z",
    isSortingAllowed: true,
  },
  created_at: {
    title: "Joining Date",
    ascendingOrderKey: "created_at",
    ascendingOrderTitle: "Old",
    descendingOrderKey: "-created_at",
    descendingOrderTitle: "New",
    isSortingAllowed: true,
  },
  account_type: {
    title: "Account Type",
    ascendingOrderKey: "is_instance_admin",
    ascendingOrderTitle: "User",
    descendingOrderKey: "-is_instance_admin",
    descendingOrderTitle: "Instance Admin",
    isSortingAllowed: true,
  },
  status: {
    title: "Status",
    ascendingOrderKey: "is_active",
    ascendingOrderTitle: "Active",
    descendingOrderKey: "-is_active",
    descendingOrderTitle: "Inactive",
    isSortingAllowed: true,
  },
};
