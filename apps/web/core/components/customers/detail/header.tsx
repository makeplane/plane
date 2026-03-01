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
import React, { useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
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
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { CustomerQuickActions } from "@/components/customers/actions";
import { getCustomerLogoSrc } from "@/components/customers/utils";
import { useCustomers } from "@/plane-web/hooks/store";

export const CustomerDetailHeader = observer(function CustomerDetailHeader() {
  const { workspaceSlug, customerId } = useParams();
  const router = useAppRouter();
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { getCustomerById, customerIds } = useCustomers();
  const { toggleCustomerDetailSidebar, customerDetailSidebarCollapsed } = useCustomers();
  // derived values
  const workspaceId = currentWorkspace?.id || undefined;

  const parentRef = useRef<HTMLDivElement>(null);

  const customer = getCustomerById(customerId.toString());
  if (!workspaceSlug || !workspaceId) return <></>;

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
                    selectedItem={customerId.toString()}
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
                customerId={customerId.toString()}
                workspaceSlug={workspaceSlug.toString()}
                parentRef={parentRef}
                customClassName="p-1 rounded-sm outline-none hover:bg-layer-1 bg-layer-1/70"
              />
            </div>
          )}
        </Header.RightItem>
      </Header>
    </>
  );
});
