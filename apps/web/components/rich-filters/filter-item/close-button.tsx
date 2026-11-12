/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { IconPill } from "@makeplane/propel/components/pill";
import { CloseOutline } from "@makeplane/propel/icons";
import type { IFilterInstance } from "@plane/shared-state";
import type { TExternalFilter, TFilterProperty } from "@plane/types";

interface FilterItemCloseButtonProps<P extends TFilterProperty, E extends TExternalFilter> {
  conditionId: string;
  filter: IFilterInstance<P, E>;
}

export const FilterItemCloseButton = observer(function FilterItemCloseButton<
  P extends TFilterProperty,
  E extends TExternalFilter,
>(props: FilterItemCloseButtonProps<P, E>) {
  const { conditionId, filter } = props;

  const handleRemoveFilter = () => {
    filter.removeCondition(conditionId);
  };

  return <IconPill onClick={handleRemoveFilter} aria-label="Remove filter" icon={<Icon icon={CloseOutline} />} />;
});
