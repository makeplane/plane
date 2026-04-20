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

import { useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CustomerRequestIcon, CustomersIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { formatURLForDisplay } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list";
// plane web imports
import { CustomerQuickActions } from "@/components/customers/actions";
import { getCustomerLogoSrc } from "@/components/customers/utils";
import { useCustomers } from "@/plane-web/hooks/store";
import type { TCustomerDetailPermissions } from "@/store/customers/permissions/root";

type TCustomerListItemProps = {
  customerId: string;
  workspaceSlug: string;
  permissions: Pick<TCustomerDetailPermissions, "canEdit" | "canDelete">;
};

export const CustomerListItem = observer(function CustomerListItem(props: TCustomerListItemProps) {
  const { customerId, workspaceSlug, permissions } = props;
  // refs
  const parentRef = useRef(null);
  // i18n
  const { t } = useTranslation();
  // hooks
  const { getCustomerById } = useCustomers();

  // derived values
  const customer = getCustomerById(customerId);
  const requestCount = customer?.customer_request_count || 0;
  const customerLogoSrc = getCustomerLogoSrc(customer);

  if (!customer) return null;
  return (
    <ListItem
      title={""}
      itemClassName="py-3"
      prependTitleElement={
        <div className="flex gap-2 items-center">
          <div className="rounded-md border-subtle-1">
            {customerLogoSrc ? (
              <div className="bg-surface-1 rounded-md h-9 w-9 overflow-hidden border-[0.5px] border-subtle-1">
                <img src={customerLogoSrc} alt="customer logo" className="w-full h-full object-cover rounded-md" />
              </div>
            ) : (
              <div className="bg-layer-1 rounded-md flex items-center justify-center h-9 w-9">
                <CustomersIcon className="size-5 opacity-50" />
              </div>
            )}
          </div>
          <div className="w-4/5">
            <Tooltip tooltipContent={customer.name}>
              <h3 className="text-14 truncate">{customer.name}</h3>
            </Tooltip>
            {customer.website_url && (
              <Link
                className="text-13 text-tertiary cursor-pointer hover:underline"
                data-prevent-progress
                href={customer.website_url}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                target="_blank"
                rel="noopener noreferrer"
              >
                {formatURLForDisplay(customer.website_url)}
              </Link>
            )}
          </div>
        </div>
      }
      quickActionElement={
        <>
          <button className="border-[0.5px] border-strong-1 rounded-sm gap-1 flex items-center px-2 py-1 flex-shrink-0 cursor-default">
            <CustomerRequestIcon className="size-3" />
            <p className="text-11 text-primary">{`${requestCount} ${t("customers.requests.label", { count: requestCount }).toLowerCase()}`}</p>
          </button>
          <CustomerQuickActions
            customerId={customerId}
            workspaceSlug={workspaceSlug}
            parentRef={parentRef}
            permissions={permissions}
          />
        </>
      }
      itemLink={`/${workspaceSlug}/customers/${customer.id}`}
      parentRef={parentRef}
    />
  );
});
