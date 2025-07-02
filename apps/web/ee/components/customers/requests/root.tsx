import React, { FC, useEffect } from "react";
import { observer } from "mobx-react";
// plane web imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
import { Button } from "@plane/ui";
import { useUserPermissions } from "@/hooks/store";
import {
  CustomerRequestEmptyState,
  CustomerRequestForm,
  CustomerRequestListItem,
  CustomerRequestSearch,
  CustomerRequestSearchEmptyState,
} from "@/plane-web/components/customers";
import { useCustomers } from "@/plane-web/hooks/store";

type TProps = {
  workspaceSlug: string;
  customerId: string;
};

export const CustomerRequestsRoot: FC<TProps> = observer((props) => {
  const { workspaceSlug, customerId } = props;

  // i18n
  const { t } = useTranslation();
  // hooks
  const {
    getFilteredCustomerRequestIds,
    customerRequestSearchQuery,
    createUpdateRequestModalId,
    toggleCreateUpdateRequestModal,
  } = useCustomers();
  const { allowPermissions } = useUserPermissions();

  // derived values
  const requestIds = getFilteredCustomerRequestIds(customerId);
  const isEditable = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const isRequestFormOpen = createUpdateRequestModalId === customerId;

  const handleFormClose = () => {
    toggleCreateUpdateRequestModal(null);
  };

  const handleFormOpen = () => {
    toggleCreateUpdateRequestModal(customerId);
  };

  useEffect(() => {
    toggleCreateUpdateRequestModal(null);
  }, []);

  return (
    <>
      {/* Header */}
      <div className="flex justify-between pb-4">
        <h3 className="text-xl font-medium">{t("customers.requests.label", { count: 2 })}</h3>
        <div className="flex gap-2 items-center">
          <CustomerRequestSearch />
          {isEditable && (
            <Button onClick={handleFormOpen} disabled={isRequestFormOpen} size="sm" className="px-2 py-1">
              {t("customers.requests.add")}
            </Button>
          )}
        </div>
      </div>
      {!requestIds?.length &&
        (customerRequestSearchQuery === "" ? (
          <CustomerRequestEmptyState addRequest={handleFormOpen} />
        ) : (
          <CustomerRequestSearchEmptyState />
        ))}
      <CustomerRequestForm
        isOpen={isRequestFormOpen}
        handleClose={handleFormClose}
        workspaceSlug={workspaceSlug}
        customerId={customerId}
      />
      {/* Customer Request List */}
      <div className="space-y-3 pb-5">
        {requestIds &&
          requestIds.map((id) => (
            <CustomerRequestListItem
              workspaceSlug={workspaceSlug}
              requestId={id}
              customerId={customerId}
              key={id}
              isEditable={isEditable}
            />
          ))}
      </div>
    </>
  );
});
