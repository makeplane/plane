import React, { FC, useState } from "react";
import { observer } from "mobx-react";
// plane web imports
import { EUserPermissionsLevel, EUserWorkspaceRoles } from "@plane/constants";
import { Button } from "@plane/ui";
import { useUserPermissions } from "@/hooks/store";
import {
  CustomerRequestEmptyState,
  CustomerRequestForm,
  CustomerRequestListItem,
  CustomerRequestSearch,
} from "@/plane-web/components/customers";
import { useCustomers } from "@/plane-web/hooks/store";
import { useTranslation } from "@plane/i18n";

type TProps = {
  workspaceSlug: string;
  customerId: string;
};

export const CustomerRequestsRoot: FC<TProps> = observer((props) => {
  const { workspaceSlug, customerId } = props;
  const [isRequestFormOpen, setRequestForm] = useState<boolean>(false);

  // i18n
  const { t } = useTranslation();
  // hooks
  const { getFilteredCustomerRequestIds } = useCustomers();
  const { allowPermissions } = useUserPermissions();

  // derived values
  const requestIds = getFilteredCustomerRequestIds(customerId);
  const isEditable = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const handleFormClose = () => {
    setRequestForm(false);
  };

  const handleFormOpen = () => {
    if (!isRequestFormOpen) setRequestForm(true);
  };
  return (
    <>
      {/* Header */}
      <div className="flex justify-between pb-4">
        <h3 className="text-xl font-medium">{t("customers.requests.label", { count: 2 })}</h3>
        <div className="flex gap-2 items-center">
          <CustomerRequestSearch />
          {isEditable && (
            <Button onClick={handleFormOpen} disabled={isRequestFormOpen} size="sm">
              {t("customers.requests.add")}
            </Button>
          )}
        </div>
      </div>
      {!isRequestFormOpen && !requestIds?.length && <CustomerRequestEmptyState addRequest={handleFormOpen} />}
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
