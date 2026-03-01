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

import React, { useEffect } from "react";
import { observer } from "mobx-react";
// ui
import { Loader } from "@plane/ui";
// plane web components
import { CustomerAdditionalPropertyValuesCreate } from "@/components/customers";
// plane web hooks
import { useCustomerModal } from "@/plane-web/hooks/context/use-customer-modal";
import { useCustomerProperties } from "@/plane-web/hooks/store";

type TCustomerAdditionalPropertiesProps = {
  customerId: string | undefined;
  workspaceSlug: string;
};

export const CustomerAdditionalProperties = observer(function CustomerAdditionalProperties(
  props: TCustomerAdditionalPropertiesProps
) {
  const { workspaceSlug, customerId } = props;
  // store hooks
  const { customerPropertyValues, setCustomerPropertyValues } = useCustomerModal();
  const { fetchAllCustomerPropertiesAndOptions, loader: propertiesLoader } = useCustomerProperties();

  useEffect(() => {
    fetchAllCustomerPropertiesAndOptions(workspaceSlug?.toString());
  }, [fetchAllCustomerPropertiesAndOptions, workspaceSlug]);

  if (!customerPropertyValues || !setCustomerPropertyValues) return;

  return (
    <>
      {propertiesLoader ? (
        <Loader className="space-y-4 py-2">
          <Loader.Item height="30px" />
          <Loader.Item height="30px" />
          <Loader.Item height="30px" width="50%" />
          <Loader.Item height="30px" width="50%" />
        </Loader>
      ) : (
        <>
          <CustomerAdditionalPropertyValuesCreate workspaceSlug={workspaceSlug} customerId={customerId} />
        </>
      )}
    </>
  );
});
