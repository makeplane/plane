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
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CustomersIcon } from "@plane/propel/icons";
import { Breadcrumbs } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
// plane web components
import { CustomerSearch } from "@/components/customers/list";
import { useCustomers } from "@/plane-web/hooks/store";

type CustomersListHeaderProps = {
  workspaceSlug: string;
};

export const CustomersListHeader = observer(function CustomersListHeader(props: CustomersListHeaderProps) {
  const { workspaceSlug } = props;
  // i18n
  const { t } = useTranslation();
  // hooks
  const { toggleCreateCustomerModal } = useCommandPalette();
  const { permissions } = useCustomers();

  return (
    <>
      <div className="flex-shrink-0 relative z-10 flex h-header w-full">
        <div className="w-full h-full relative flex justify-between items-center gap-x-2 gap-y-4">
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={t("customers.label", { count: 2 })} // count for pluralization
                  icon={<CustomersIcon className="h-4 w-4 text-tertiary" />}
                />
              }
            />
          </Breadcrumbs>
          <div className="flex items-center gap-2">
            <CustomerSearch />
            {permissions.getCanCreate(workspaceSlug) && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => toggleCreateCustomerModal({ isOpen: true, customerId: undefined })}
                className="items-center gap-1"
              >
                <span className="hidden md:inline-block">{t("customers.create.label")}</span>
                <span className="inline-block md:hidden">{t("customers.label", { count: 1 })}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
