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
import type { TCustomer } from "@plane/types";
import { Spinner } from "@plane/ui";
// plane-web hooks
import { useCustomers } from "@/plane-web/hooks/store";
// local imports
import { PowerKCustomersMenu } from "../../menus/customers";

type Props = {
  handleSelect: (customer: TCustomer) => void;
};

export const PowerKOpenCustomersMenu = observer(function PowerKOpenCustomersMenu(props: Props) {
  const { handleSelect } = props;
  // store hooks
  const { loader, customerIds, getCustomerById } = useCustomers();
  // derived values
  const customersList = customerIds
    ? customerIds.map((customerId) => getCustomerById(customerId)).filter((customer) => !!customer)
    : [];

  if (loader === "init-loader") return <Spinner />;

  return <PowerKCustomersMenu customers={customersList} onSelect={handleSelect} />;
});
