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
import type { BaseCustomPropertyInstanceSchema, CustomPropertyType } from "@plane/types";
// local imports
import { CustomPropertyListItem } from "./property-list-item";

export type CustomPropertyListActions = {
  edit: (propertyId: string) => void;
  delete: (propertyId: string) => Promise<void>;
};

type CustomPropertyListProps = {
  properties: BaseCustomPropertyInstanceSchema<CustomPropertyType>[];
  actions: CustomPropertyListActions;
};

export const CustomPropertyList = observer(function CustomPropertyList(props: CustomPropertyListProps) {
  const { properties, actions } = props;

  return (
    <div className="w-full space-y-4">
      {properties.map((property) => (
        <CustomPropertyListItem
          key={property.id}
          property={property}
          actions={{
            edit: () => actions.edit(property.id),
            delete: () => actions.delete(property.id),
          }}
        />
      ))}
    </div>
  );
});
