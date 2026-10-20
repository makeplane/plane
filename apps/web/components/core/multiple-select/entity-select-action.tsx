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
    // d2m-plane: the checkbox lives inside the row's link (ControlLink). The checkbox re-dispatches its click on a
    // hidden <input>, and that click bubbled up to the row and opened the peek overview. Swallow every click that
    // reaches this wrapper so ticking the checkbox only toggles selection.
    // oxlint-disable-next-line jsx_a11y/click-events-have-key-events oxlint-disable-next-line jsx_a11y/no-static-element-interactions
    <span
      className={cn("inline-flex", className)}
      data-entity-group-id={groupId}
      data-entity-id={id}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
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
