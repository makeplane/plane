import React, { FC } from "react";
import { observer } from "mobx-react";
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
import { CustomersIcon } from "@plane/ui";
import { cn } from "@plane/utils";
import { useUserPermissions } from "@/hooks/store/user";
import { useCustomers } from "@/plane-web/hooks/store";
import { CustomerSidebarListitem } from "./customer-list-item";
import { CustomerSelect } from "./customer-select";

type TProps = {
  isPeekView: boolean;
  workspaceSlug: string;
  workItemId: string;
};

export const SidebarCustomersList: FC<TProps> = observer((props) => {
  const { isPeekView, workspaceSlug, workItemId } = props;
  // hooks
  const { t } = useTranslation();
  const {
    workItems: { getWorkItemCustomerIds },
  } = useCustomers();
  const { allowPermissions } = useUserPermissions();

  // derived values
  const customerIds = getWorkItemCustomerIds(workItemId);
  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE);
  return (
    <div>
      <div className="flex min-h-8 gap-2">
        <div
          className={cn("flex flex-shrink-0 gap-1 pt-2 text-sm text-custom-text-300", isPeekView ? "w-1/4" : "w-2/5")}
        >
          <CustomersIcon className="h-4 w-4 flex-shrink-0" />
          <span>{t("customers.label", { count: 2 })}</span>
        </div>
        <div className="h-full min-h-8 w-3/5 flex flex-wrap gap-2 items-center">
          {customerIds?.length
            ? customerIds?.map((id) => (
                <CustomerSidebarListitem
                  workspaceSlug={workspaceSlug}
                  isPeekView={isPeekView}
                  key={id}
                  customerId={id}
                />
              ))
            : !isAdmin && (
                <span className="text-sm text-custom-text-400 px-2">{t("customers.dropdown.no_selection")}</span>
              )}
          {isAdmin && (
            <CustomerSelect
              workspaceSlug={workspaceSlug}
              value={customerIds || null}
              workItemId={workItemId}
              compact={!!customerIds?.length}
            />
          )}
        </div>
      </div>
    </div>
  );
});
