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

import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { CustomersIcon } from "@plane/propel/icons";
import { EUserWorkspaceRoles } from "@plane/types";
import { Popover } from "@plane/propel/popover";
// components
import { getCustomerLogoSrc } from "@/components/customers/utils";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useCustomers } from "@/plane-web/hooks/store";
import { CustomerPreview } from "./preview";

type TCustomerListItem = {
  customerId: string;
  isPeekView?: boolean;
  workspaceSlug: string;
};

export const CustomerSidebarListitem = observer(function CustomerSidebarListitem(props: TCustomerListItem) {
  const { customerId, isPeekView, workspaceSlug } = props;
  // hooks
  const { getCustomerById } = useCustomers();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const customer = getCustomerById(customerId);
  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const customerLogoSrc = getCustomerLogoSrc(customer);

  if (!customer) return null;
  return (
    <Popover>
      <Popover.Trigger
        delay={0}
        openOnHover
        render={
          <button
            type="button"
            className="h-full w-full flex items-center gap-1.5 rounded-lg px-2 py-0.5 bg-layer-transparent-active hover:bg-layer-transparent-hover text-body-xs-regular text-tertiary truncate"
          >
            {customerLogoSrc ? (
              <img
                src={customerLogoSrc}
                alt="customer-logo"
                className="rounded-md w-3 h-3 object-cover flex-shrink-0"
              />
            ) : (
              <CustomersIcon className="size-4 opacity-50 flex-shrink-0" />
            )}
            <span className="text-body-xs-regular truncate">{customer.name}</span>
          </button>
        }
      />

      <Popover.Content align={"center"} side={isPeekView ? "left" : "right"} positionerClassName="z-40">
        {isAdmin && <CustomerPreview workspaceSlug={workspaceSlug} customer={customer} />}
      </Popover.Content>
    </Popover>
  );
});
