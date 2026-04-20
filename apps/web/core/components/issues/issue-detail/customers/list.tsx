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
import { useTranslation } from "@plane/i18n";
import { CustomersIcon } from "@plane/propel/icons";
import { useCustomers } from "@/plane-web/hooks/store";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { CustomerSidebarListitem } from "./list-item";
import { CustomerSelect } from "./dropdown";

type TProps = {
  isPeekView: boolean;
  workspaceSlug: string;
  workItemId: string;
  canEdit: boolean;
};

export const SidebarCustomersList = observer(function SidebarCustomersList(props: TProps) {
  const { isPeekView, workspaceSlug, workItemId, canEdit } = props;
  // hooks
  const { t } = useTranslation();
  const {
    workItems: { getWorkItemCustomerIds },
  } = useCustomers();
  // derived values
  const customerIds = getWorkItemCustomerIds(workItemId);

  return (
    <SidebarPropertyListItem icon={CustomersIcon} label={t("customers.label", { count: 2 })}>
      <div className="flex  flex-col gap-0.5 px-2 truncate">
        {customerIds?.length
          ? customerIds?.map((id) => (
              <CustomerSidebarListitem
                workspaceSlug={workspaceSlug}
                isPeekView={isPeekView}
                key={id}
                customerId={id}
                canPreview={canEdit}
              />
            ))
          : !canEdit && <span className="text-13 text-placeholder">{t("customers.dropdown.no_selection")}</span>}
      </div>
      {canEdit && (
        <CustomerSelect
          customButtonClassName="w-full h-7.5 text-left"
          workspaceSlug={workspaceSlug}
          value={customerIds || null}
          workItemId={workItemId}
          disabled={!canEdit}
        />
      )}
    </SidebarPropertyListItem>
  );
});
