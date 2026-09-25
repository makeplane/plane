/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Checkbox } from "@makeplane/propel/components/checkbox";
import { cn } from "@plane/utils";
// hooks
import type { TSelectionHelper } from "@/hooks/use-multiple-select";

type Props = {
  className?: string;
  disabled?: boolean;
  groupId: string;
  id: string;
  selectionHelpers: TSelectionHelper;
};

export const MultipleSelectEntityAction = observer(function MultipleSelectEntityAction(props: Props) {
  const { className, disabled = false, groupId, id, selectionHelpers } = props;
  // derived values
  const isSelected = selectionHelpers.getIsEntitySelected(id);

  if (selectionHelpers.isSelectionDisabled) return null;

  return (
    <span className={cn("inline-flex", className)} data-entity-group-id={groupId} data-entity-id={id}>
      <Checkbox
        checked={isSelected}
        disabled={disabled}
        aria-label="Select work item"
        onClick={(e) => {
          e.stopPropagation();
          selectionHelpers.handleEntityClick(e, id, groupId);
        }}
      />
    </span>
  );
});
