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

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { CustomersIcon } from "@plane/propel/icons";
import type { TCustomer } from "@plane/types";
import { SwitcherIcon } from "@/components/common/switcher-label";
import { getCustomerLogoSrc } from "@/components/customers/utils";
import { PowerKMenuBuilder } from "@/components/power-k/menus/builder";

type Props = {
  customers: TCustomer[];
  onSelect: (customer: TCustomer) => void;
};

export const PowerKCustomersMenu = observer(function PowerKCustomersMenu({ customers, onSelect }: Props) {
  return (
    <PowerKMenuBuilder
      heading="Customers"
      items={customers}
      getIconNode={(customer) => (
        <SwitcherIcon logo_url={getCustomerLogoSrc(customer)} LabelIcon={CustomersIcon} size={14} />
      )}
      getKey={(customer) => customer.id || customer.name}
      getLabel={(customer) => customer.name}
      getValue={(customer) => customer.name}
      onSelect={onSelect}
      emptyText="No customers found"
    />
  );
});
