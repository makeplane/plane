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
// plane imports
import { PanelRight } from "lucide-react";
import { CustomersIcon } from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
import type { ICustomSearchSelectOption } from "@plane/types";
import { Breadcrumbs, Header, BreadcrumbNavigationSearchDropdown } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SwitcherLabel } from "@/components/common/switcher-label";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { CustomerQuickActions } from "@/components/customers/actions";
import { getCustomerLogoSrc } from "@/components/customers/utils";
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  workspaceSlug: string;
  customerId: string;
};

export const CustomerDetailHeader = observer(function CustomerDetailHeader(props: TProps) {
  const { workspaceSlug, customerId } = props;
  // router
  const router = useAppRouter();
  // refs
  const parentRef = useRef<HTMLDivElement>(null);
  // hooks
  const { getCustomerById, customerIds, permissions, toggleCustomerDetailSidebar, customerDetailSidebarCollapsed } =
    useCustomers();
  // derived values
  const customer = getCustomerById(customerId);
  const customerPermissions = {
    canEdit: permissions.getCanEdit(workspaceSlug, customerId),
    canDelete: permissions.getCanDelete(workspaceSlug, customerId),
  };

  const switcherOptions = customerIds
    .map((id) => {
      const _customer = getCustomerById(id);
      if (!_customer?.id || !_customer?.name) return null;
      return {
        value: _customer.id,
        query: _customer.name,
        content: (
          <SwitcherLabel logo_url={getCustomerLogoSrc(_customer)} name={_customer.name} LabelIcon={CustomersIcon} />
        ),
      };
    })
    .filter((option) => option !== undefined) as ICustomSearchSelectOption[];

  return (
    <>
      <Header>
        <Header.LeftItem>
          <div className="flex items-center gap-4">
            {/* bread crumps */}
            <Breadcrumbs>
              <Breadcrumbs.Item
                component={
                  <BreadcrumbLink
                    href={`/${workspaceSlug}/customers`}
                    label="Customers"
                    icon={<CustomersIcon className="h-4 w-4 text-tertiary" />}
                  />
                }
              />
              <Breadcrumbs.Item
                component={
                  <BreadcrumbNavigationSearchDropdown
                    selectedItem={customerId}
                    navigationItems={switcherOptions}
                    onChange={(value: string) => {
                      router.push(`/${workspaceSlug}/customers/${value}`);
                    }}
                    title={customer?.name}
                    icon={
                      <Breadcrumbs.Icon>
                        <CustomersIcon className="size-4 flex-shrink-0 text-tertiary" />
                      </Breadcrumbs.Icon>
                    }
                    isLast
                  />
                }
                isLast
              />
            </Breadcrumbs>
          </div>
        </Header.LeftItem>
        <Header.RightItem>
          {customer && (
            <div ref={parentRef} className="flex gap-2 items-center transition-colors duration-200">
              <IconButton
                variant="tertiary"
                size="lg"
                icon={PanelRight}
                onClick={() => toggleCustomerDetailSidebar()}
                className={cn({
                  "text-accent-primary bg-accent-subtle": !customerDetailSidebarCollapsed,
                })}
              />
              <CustomerQuickActions
                customerId={customerId}
                workspaceSlug={workspaceSlug}
                parentRef={parentRef}
                customClassName="p-1 rounded-sm outline-none hover:bg-layer-1 bg-layer-1/70"
                permissions={customerPermissions}
              />
            </div>
          )}
        </Header.RightItem>
      </Header>
    </>
  );
});
