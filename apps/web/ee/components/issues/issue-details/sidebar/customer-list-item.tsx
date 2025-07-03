import React, { FC, Fragment, useState } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Popover, Transition } from "@headlessui/react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
import { CustomersIcon } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// components
// hooks
import { useUserPermissions } from "@/hooks/store";
import { useCustomers } from "@/plane-web/hooks/store";
import { CustomerPreview } from "./preview";

type TCustomerListItem = {
  customerId: string;
  isPeekView?: boolean;
  workspaceSlug: string;
};

export const CustomerSidebarListitem: FC<TCustomerListItem> = observer((props) => {
  const { customerId, isPeekView, workspaceSlug } = props;
  // refs
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  // hooks
  const { getCustomerById } = useCustomers();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const customer = getCustomerById(customerId);
  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: isPeekView ? "right" : "left",
  });

  if (!customer) return null;
  return (
    <Popover as="div" className="truncate max-w-[200px]">
      <div
        className="flex gap-2 items-center py-0.5 px-1.5 border rounded-full border-custom-border-100 cursor-default truncate"
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
        ref={setReferenceElement}
      >
        <div className="border border-custom-border-200 rounded-md flex items-center gap-2">
          {customer.logo_url ? (
            <img src={getFileURL(customer.logo_url)} alt="customer-logo" className="rounded-md w-3 h-3 object-cover" />
          ) : (
            <div className="bg-custom-background-90 rounded-md flex items-center justify-center h-3 w-3 p-0.5">
              <CustomersIcon className="size-5 opacity-50" />
            </div>
          )}
        </div>
        <div className="text-custom-text-200 flex flex-col truncate">
          <span className="text-xs font-medium truncate">{customer.name}</span>
        </div>
      </div>
      <Transition as={Fragment} show={showPreview}>
        <Popover.Panel
          {...attributes.popper}
          className={""}
          onMouseEnter={() => setShowPreview(true)}
          onMouseLeave={() => setShowPreview(false)}
        >
          {isAdmin && (
            <CustomerPreview
              workspaceSlug={workspaceSlug}
              customer={customer}
              setPopperElement={setPopperElement}
              styles={styles}
            />
          )}
        </Popover.Panel>
      </Transition>
    </Popover>
  );
});
