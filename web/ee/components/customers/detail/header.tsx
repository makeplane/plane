"use client";
import React, { FC, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Sidebar } from "lucide-react";
import { Breadcrumbs, CustomersIcon, Header } from "@plane/ui";
// components
import { cn } from "@plane/utils";
import { BreadcrumbLink } from "@/components/common";
// hooks
import { useWorkspace } from "@/hooks/store";
// plane web imports
import { CustomerQuickActions } from "@/plane-web/components/customers/actions";
import { useCustomers } from "@/plane-web/hooks/store";

export const CustomerDetailHeader: FC = observer(() => {
  const { workspaceSlug, customerId } = useParams();
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { getCustomerById } = useCustomers();
  const { toggleCustomerDetailSidebar, customerDetailSidebarCollapsed } = useCustomers();
  // derived values
  const workspaceId = currentWorkspace?.id || undefined;

  const parentRef = useRef<HTMLDivElement>(null);

  const customer = getCustomerById(customerId.toString());
  if (!workspaceSlug || !workspaceId) return <></>;

  return (
    <>
      <Header>
        <Header.LeftItem>
          <div className="flex items-center gap-4">
            {/* bread crumps */}
            <Breadcrumbs>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink
                    href={`/${workspaceSlug}/customers`}
                    label="Customers"
                    icon={<CustomersIcon className="h-4 w-4 text-custom-text-300" />}
                  />
                }
              />
              <Breadcrumbs.BreadcrumbItem type="text" link={<BreadcrumbLink label={customer?.name} />} />
            </Breadcrumbs>
          </div>
        </Header.LeftItem>
        <Header.RightItem>
          {customer && (
            <div ref={parentRef} className="flex gap-2 items-center">
              <CustomerQuickActions
                customerId={customerId.toString()}
                workspaceSlug={workspaceSlug.toString()}
                parentRef={parentRef}
              />
              <Sidebar
                className={cn("size-4 cursor-pointer", {
                  "text-custom-primary-100": !customerDetailSidebarCollapsed,
                })}
                onClick={() => toggleCustomerDetailSidebar()}
              />
            </div>
          )}
        </Header.RightItem>
      </Header>
    </>
  );
});
