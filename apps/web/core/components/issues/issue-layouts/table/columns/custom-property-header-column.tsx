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
import type { TIssuePropertyTypeIconKey } from "@plane/types";
// components
import { PropertyTypeIcon } from "@/components/work-item-types/properties/property-icon";
// hooks
import { useIssueTypes } from "@/plane-web/hooks/store";

export type CustomPropertyHeaderColumnProps = {
  propertyId: string;
};

export const CustomPropertyHeaderColumn = observer(function CustomPropertyHeaderColumn(
  props: CustomPropertyHeaderColumnProps
) {
  const { propertyId } = props;
  // store hooks
  const { getIssuePropertyById } = useIssueTypes();

  const propertyDetail = getIssuePropertyById(propertyId);

  if (!propertyDetail) return null;

  const iconKey = propertyDetail.logo_props?.icon?.name as TIssuePropertyTypeIconKey | undefined;

  return (
    <div className="flex h-full w-full items-center gap-1.5 px-page-x text-secondary">
      {iconKey && <PropertyTypeIcon iconKey={iconKey} className="h-3.5 w-3.5 flex-shrink-0 text-tertiary" />}
      <span className="truncate">{propertyDetail.display_name}</span>
    </div>
  );
});
