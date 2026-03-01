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

import { observer } from "mobx-react";
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CustomersIcon } from "@plane/propel/icons";
import { EUserWorkspaceRoles } from "@plane/types";
import { useUserPermissions } from "@/hooks/store/user";
import { useCustomers } from "@/plane-web/hooks/store";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { CustomerSidebarListitem } from "./list-item";
import { CustomerSelect } from "./dropdown";

type TProps = {
  isPeekView: boolean;
  workspaceSlug: string;
  workItemId: string;
  disabled?: boolean;
};

export const SidebarCustomersList = observer(function SidebarCustomersList(props: TProps) {
  const { isPeekView, workspaceSlug, workItemId, disabled = false } = props;
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
    <SidebarPropertyListItem icon={CustomersIcon} label={t("customers.label", { count: 2 })}>
      <div className="flex  flex-col gap-0.5 px-2 truncate">
        {customerIds?.length
          ? customerIds?.map((id) => (
              <CustomerSidebarListitem workspaceSlug={workspaceSlug} isPeekView={isPeekView} key={id} customerId={id} />
            ))
          : !isAdmin && <span className="text-13 text-placeholder">{t("customers.dropdown.no_selection")}</span>}
      </div>
      {isAdmin && (
        <CustomerSelect
          customButtonClassName="w-full h-7.5 text-left"
          workspaceSlug={workspaceSlug}
          value={customerIds || null}
          workItemId={workItemId}
          disabled={disabled}
        />
      )}
    </SidebarPropertyListItem>
  );
});
