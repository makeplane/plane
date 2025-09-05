"use client";
import React, { FC, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { PanelRight } from "lucide-react";
import { CustomersIcon } from "@plane/propel/icons";
import { ICustomSearchSelectOption } from "@plane/types";
import { Breadcrumbs,Header,BreadcrumbNavigationSearchDropdown } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SwitcherLabel } from "@/components/common/switcher-label";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { CustomerQuickActions } from "@/plane-web/components/customers/actions";
import { useCustomers } from "@/plane-web/hooks/store";

export const CustomerDetailHeader: FC = observer(() => {
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
        content: <SwitcherLabel logo_url={_customer.logo_url} name={_customer.name} LabelIcon={CustomersIcon} />,
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
                    icon={<CustomersIcon className="h-4 w-4 text-custom-text-300" />}
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
                        <CustomersIcon className="size-4 flex-shrink-0 text-custom-text-300" />
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
            <div ref={parentRef} className="flex gap-2 items-center">
              <button
                type="button"
                className="p-1 rounded outline-none hover:bg-custom-sidebar-background-80 bg-custom-background-80/70"
                onClick={() => toggleCustomerDetailSidebar()}
              >
                <PanelRight
                  className={cn("h-4 w-4", !customerDetailSidebarCollapsed ? "text-[#3E63DD]" : "text-custom-text-200")}
                />
              </button>
              <CustomerQuickActions
                customerId={customerId.toString()}
                workspaceSlug={workspaceSlug.toString()}
                parentRef={parentRef}
                customClassName="p-1 rounded outline-none hover:bg-custom-sidebar-background-80 bg-custom-background-80/70"
              />
            </div>
          )}
        </Header.RightItem>
      </Header>
    </>
  );
});
