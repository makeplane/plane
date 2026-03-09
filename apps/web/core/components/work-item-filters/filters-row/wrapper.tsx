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
import { useParams } from "react-router";
// plane imports
import type { TWorkItemFilterExpression, TWorkItemFilterProperty } from "@plane/types";
// components
import type { TFiltersRowProps } from "@/components/rich-filters/filters-row";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store";
// local imports
import type { TSharedWorkItemFiltersHOCChildrenProps } from "../filters-hoc/shared";
import { WorkItemAdvancedFiltersRow } from "./advanced/root";
import { WorkItemFiltersRow } from "./basic";

type Props = Omit<TFiltersRowProps<TWorkItemFilterProperty, TWorkItemFilterExpression>, "filter"> &
  TSharedWorkItemFiltersHOCChildrenProps & {
    disablePQL?: boolean;
  };

export const WorkItemFiltersRowWrapper = observer(function WorkItemFiltersRowWrapper({
  disablePQL = false,
  ...rest
}: Props) {
  // params
  const { workspaceSlug } = useParams();
  const isPQLEnabled = useFlag(workspaceSlug, "PQL");

  if (!rest.filter) return null;

  return (
    <>
      {!disablePQL && isPQLEnabled ? (
        <WorkItemAdvancedFiltersRow {...rest} />
      ) : (
        <WorkItemFiltersRow {...rest} filter={rest.filter.richFiltersInstance} />
      )}
    </>
  );
});
