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

import { computedFn } from "mobx-utils";
import type { PermissionCheckArgs, TCustomer } from "@plane/types";
import { CustomerRequestPermissionsInstance } from "./request";

export type TCustomerProperty = keyof TCustomer | "custom_properties";

export interface CustomerPermissions {
  // Customer CRUD
  getCanView: (workspaceSlug: string) => boolean;
  getCanCreate: (workspaceSlug: string) => boolean;
  getCanEdit: (workspaceSlug: string, customerId: string) => boolean;
  getCanDelete: (workspaceSlug: string, customerId: string) => boolean;
  // Property-level editing (all delegate to getCanEdit; named for future granularity)
  getCanEditProperty: (workspaceSlug: string, customerId: string, property: TCustomerProperty) => boolean;
  // Link/unlink work items (delegates to getCanEdit)
  getCanLinkWorkItem: (workspaceSlug: string, customerId: string) => boolean;
  getCanUnlinkWorkItem: (workspaceSlug: string, customerId: string) => boolean;
  // Attachments on requests (customer_attachment resource)
  getCanAddAttachment: (workspaceSlug: string) => boolean;
  getCanDeleteAttachment: (workspaceSlug: string, customerId: string) => boolean;
  // Request permissions sub-object
  getRequestPermissions: (workspaceSlug: string, customerId: string) => CustomerRequestPermissionsInstance;
}

type CustomerPermissionsArgs = {
  can: (args: PermissionCheckArgs) => boolean;
};

export class CustomerPermissionsInstance implements CustomerPermissions {
  constructor(private args: CustomerPermissionsArgs) {}

  getCanView: CustomerPermissions["getCanView"] = computedFn((workspaceSlug) =>
    this.args.can({ resource: "customer", action: "view", workspaceSlug })
  );

  getCanCreate: CustomerPermissions["getCanCreate"] = computedFn((workspaceSlug) =>
    this.args.can({ resource: "customer", action: "create", workspaceSlug })
  );

  getCanEdit: CustomerPermissions["getCanEdit"] = computedFn((workspaceSlug, customerId) =>
    this.args.can({
      resource: "customer",
      action: "edit",
      workspaceSlug,
      resourceMeta: { resourceId: customerId },
    })
  );

  getCanDelete: CustomerPermissions["getCanDelete"] = computedFn((workspaceSlug, customerId) =>
    this.args.can({
      resource: "customer",
      action: "delete",
      workspaceSlug,
      resourceMeta: { resourceId: customerId },
    })
  );

  getCanEditProperty: CustomerPermissions["getCanEditProperty"] = computedFn((workspaceSlug, customerId, _property) =>
    this.getCanEdit(workspaceSlug, customerId)
  );

  getCanLinkWorkItem: CustomerPermissions["getCanLinkWorkItem"] = computedFn((workspaceSlug, customerId) =>
    this.getCanEdit(workspaceSlug, customerId)
  );

  getCanUnlinkWorkItem: CustomerPermissions["getCanUnlinkWorkItem"] = computedFn((workspaceSlug, customerId) =>
    this.getCanEdit(workspaceSlug, customerId)
  );

  getCanAddAttachment: CustomerPermissions["getCanAddAttachment"] = computedFn((workspaceSlug) =>
    this.args.can({ resource: "customer_attachment", action: "create", workspaceSlug })
  );

  getCanDeleteAttachment: CustomerPermissions["getCanDeleteAttachment"] = computedFn((workspaceSlug, customerId) =>
    this.args.can({
      resource: "customer_attachment",
      action: "delete",
      workspaceSlug,
      resourceMeta: {
        resourceId: customerId,
      },
    })
  );

  getRequestPermissions: CustomerPermissions["getRequestPermissions"] = computedFn(
    (workspaceSlug, customerId): CustomerRequestPermissionsInstance =>
      new CustomerRequestPermissionsInstance({
        can: this.args.can,
        workspaceSlug,
        customerId,
      })
  );
}

export type TCustomerDetailPermissions = {
  canEdit: boolean;
  canDelete: boolean;
  canEditProperty: (property: TCustomerProperty) => boolean;
  canLinkWorkItem: boolean;
  canUnlinkWorkItem: boolean;
  canAddAttachment: boolean;
  canDeleteAttachment: boolean;
  requests: {
    canCreate: boolean;
    getCanEdit: (requestId: string) => boolean;
    getCanDelete: (requestId: string) => boolean;
    getCanAddAttachment: (requestId: string) => boolean;
    getCanDeleteAttachment: (requestId: string) => boolean;
  };
};

export type TCustomerRequestPermissions = {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAddAttachment: boolean;
  canDeleteAttachment: boolean;
};
