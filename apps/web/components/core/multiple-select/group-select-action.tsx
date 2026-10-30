/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { Checkbox } from "@makeplane/propel/components/checkbox";
import { cn } from "@plane/utils";
// hooks
import type { TSelectionHelper } from "@/hooks/use-multiple-select";

type Props = {
  className?: string;
  disabled?: boolean;
  groupID: string;
  selectionHelpers: TSelectionHelper;
};

export function MultipleSelectGroupAction(props: Props) {
  const { t } = useTranslation();

  const { className, disabled = false, groupID, selectionHelpers } = props;
  // derived values
  const groupSelectionStatus = selectionHelpers.isGroupSelected(groupID);

  if (selectionHelpers.isSelectionDisabled) return null;

  return (
    <span className={cn("inline-flex", className)}>
      <Checkbox
        checked={groupSelectionStatus === "complete"}
        indeterminate={groupSelectionStatus === "partial"}
        disabled={disabled}
        aria-label={t("web_ui.select_all_in_group")}
        onCheckedChange={() => selectionHelpers.handleGroupClick(groupID)}
      />
    </span>
  );
}
