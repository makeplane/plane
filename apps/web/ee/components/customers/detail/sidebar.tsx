import React, { FC } from "react";
import { observer } from "mobx-react";
import { CUSTOMER_TRACKER_EVENTS } from "@plane/constants";
import { TCustomer } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
// plane web imports
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { SidebarWrapper } from "@/plane-web/components/common/layout/sidebar/sidebar-wrapper";
import {
  CustomerAdditionalPropertyValuesUpdate,
  CustomerDefaultSidebarProperties,
} from "@/plane-web/components/customers";
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  customerId: string;
  workspaceSlug: string;
  isDisabled: boolean;
};

export const CustomerDetailSidebar: FC<TProps> = observer((props) => {
  const { customerId, workspaceSlug, isDisabled } = props;

  // hooks
  const { getCustomerById, updateCustomer, customerDetailSidebarCollapsed } = useCustomers();
  const updateProperty = (data: Partial<TCustomer>) => {
    let _payload = { ...data };
    if (data.website_url) {
      const parsedUrl = data?.website_url?.startsWith("http") ? data.website_url : `http://${data.website_url}`;
      _payload = { ...data, website_url: parsedUrl };
    }
    updateCustomer(workspaceSlug, customerId, _payload)
      .then(() => {
        captureSuccess({
          eventName: CUSTOMER_TRACKER_EVENTS.update_customer,
          payload: {
            id: customerId,
          },
        });
      })
      .catch((error: unknown) => {
        const errorMessage = (error as { error?: string })?.error;
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: errorMessage || "Unable to update property.Try again!",
        });
        captureError({
          eventName: CUSTOMER_TRACKER_EVENTS.update_customer,
          payload: {
            id: customerId,
          },
          error: error as Error,
        });
      });
  };

  // derived values
  const customer = getCustomerById(customerId);
  if (!customer) return <></>;

  return (
    <SidebarWrapper isSidebarOpen={!customerDetailSidebarCollapsed}>
      <div className="px-6 space-y-2">
        <CustomerDefaultSidebarProperties customer={customer} updateProperty={updateProperty} isDisabled={isDisabled} />
        <CustomerAdditionalPropertyValuesUpdate
          customerId={customerId}
          workspaceSlug={workspaceSlug}
          isDisabled={isDisabled}
        />
      </div>
    </SidebarWrapper>
  );
});
