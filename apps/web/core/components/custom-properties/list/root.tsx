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
import { CustomPropertyType } from "@plane/types";
import type { BaseCustomPropertyInstanceSchema } from "@plane/types";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { Loader } from "@plane/ui";
// local imports
import { CustomPropertyList } from "./property-list";
import type { CustomPropertyListActions } from "./property-list";

type CustomPropertiesListRootProps = {
  properties: BaseCustomPropertyInstanceSchema<CustomPropertyType>[];
  isInitializing: boolean;
  actions: CustomPropertyListActions;
};

export const CustomPropertiesListRoot = observer(function CustomPropertiesListRoot(
  props: CustomPropertiesListRootProps
) {
  const { properties, isInitializing, actions } = props;
  // derived values
  const isAnyPropertiesAvailable = properties && properties?.length > 0;

  if (isInitializing) {
    return (
      <Loader className="w-full space-y-4 py-4">
        <Loader.Item height="68px" width="100%" />
        <Loader.Item height="68px" width="100%" />
        <Loader.Item height="68px" width="100%" />
        <Loader.Item height="48px" width="100%" />
        <Loader.Item height="48px" width="100%" />
      </Loader>
    );
  }

  if (isAnyPropertiesAvailable && properties) {
    return <CustomPropertyList properties={properties} actions={actions} />;
  }

  if (!isAnyPropertiesAvailable && !isInitializing) {
    return (
      <div className="w-full py-6 px-2 border border-subtle rounded-lg">
        <EmptyStateCompact
          assetKey="custom-properties"
          title={"No custom properties added"}
          description={"Define properties to track specific data for your work item types."}
        />
      </div>
    );
  }
});
