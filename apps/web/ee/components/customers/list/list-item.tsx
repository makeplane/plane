import React, { FC, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CustomerRequestIcon,CustomersIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { getFileURL } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list";
// plane web imports
import { CustomerQuickActions } from "@/plane-web/components/customers/actions";
import { useCustomers } from "@/plane-web/hooks/store";

type TCustomerListItemProps = {
  customerId: string;
  workspaceSlug: string;
};

export const CustomerListItem: FC<TCustomerListItemProps> = observer((props) => {
  const { customerId, workspaceSlug } = props;
  // refs
  const parentRef = useRef(null);
  // i18n
  const { t } = useTranslation();
  // hooks
  const { getCustomerById } = useCustomers();

  // derived values
  const customer = getCustomerById(customerId);
  const requestCount = customer?.customer_request_count || 0;

  if (!customer) return null;
  return (
    <ListItem
      title={""}
      itemClassName="py-3"
      prependTitleElement={
        <div className="flex gap-2 items-center">
          <div className="rounded-md border-custom-border-300">
            {customer?.logo_url && customer.logo_url !== "" ? (
              <div className="bg-custom-background-100 rounded-md h-9 w-9 overflow-hidden border-[0.5px] border-custom-border-300">
                <img
                  src={getFileURL(customer.logo_url)}
                  alt="customer logo"
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            ) : (
              <div className="bg-custom-background-90 rounded-md flex items-center justify-center h-9 w-9">
                <CustomersIcon className="size-5 opacity-50" />
              </div>
            )}
          </div>
          <div className="w-4/5">
            <Tooltip tooltipContent={customer.name}>
              <h3 className="text-base truncate">{customer.name}</h3>
            </Tooltip>
            {customer.website_url && (
              <Link
                className="text-sm text-custom-text-300 cursor-pointer hover:underline"
                data-prevent-progress
                href={customer.website_url}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                target="_blank"
                rel="noopener noreferrer"
              >
                {customer.website_url}
              </Link>
            )}
          </div>
        </div>
      }
      quickActionElement={
        <>
          <button className="border-[0.5px] border-custom-border-400 rounded gap-1 flex items-center px-2 py-1 flex-shrink-0 cursor-default">
            <CustomerRequestIcon className="size-3" />
            <p className="text-xs text-custom-text-100">{`${requestCount} ${t("customers.requests.label", { count: requestCount }).toLowerCase()}`}</p>
          </button>
          <CustomerQuickActions customerId={customerId} workspaceSlug={workspaceSlug} parentRef={parentRef} />
        </>
      }
      itemLink={`/${workspaceSlug}/customers/${customer.id}`}
      parentRef={parentRef}
    />
  );
});
