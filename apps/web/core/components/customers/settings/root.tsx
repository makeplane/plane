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
// components
import { SettingsHeading } from "@/components/settings/heading";
// plane web imports
import {
  CustomerSettingsDisabled,
  CustomerPropertiesLoader,
  CustomerPropertiesRoot,
} from "@/components/customers/settings";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useCustomerProperties } from "@/plane-web/hooks/store/customers/use-customer-properties";

type TCustomerSettingsRoot = {
  workspaceId: string;
  toggleCustomersFeature: () => void;
  isCustomersFeatureEnabled: boolean;
};

export const CustomerSettingsRoot = observer(function CustomerSettingsRoot(props: TCustomerSettingsRoot) {
  const { toggleCustomersFeature, isCustomersFeatureEnabled } = props;

  const { loader } = useWorkspaceFeatures();
  const { loader: customerPropertiesLoader } = useCustomerProperties();
  // derived values
  const isLoader = loader || customerPropertiesLoader;
  return (
    <div className="mt-12">
      <SettingsHeading
        title="Custom properties"
        description="Customize customers properties to match your projects unique work structure"
        variant="h6"
      />
      <div className="mt-4">
        {isCustomersFeatureEnabled ? (
          isLoader ? (
            <CustomerPropertiesLoader />
          ) : (
            <CustomerPropertiesRoot />
          )
        ) : (
          <CustomerSettingsDisabled toggleCustomersFeature={toggleCustomersFeature} />
        )}
      </div>
    </div>
  );
});
