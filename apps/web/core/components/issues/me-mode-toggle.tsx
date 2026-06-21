/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { IIssueDisplayFilterOptions } from "@plane/types";
import { Avatar } from "@plane/ui";
import { cn, getFileURL } from "@plane/utils";
// hooks
import { useUser } from "@/hooks/store/user";

type TWorkItemsMeModeToggleProps = {
  displayFilters: IIssueDisplayFilterOptions | undefined;
  handleDisplayFiltersUpdate: (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => void;
};

export const WorkItemsMeModeToggle = observer(function WorkItemsMeModeToggle(props: TWorkItemsMeModeToggleProps) {
  const { displayFilters, handleDisplayFiltersUpdate } = props;
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { data: currentUser } = useUser();
  // derived values
  const isActive = displayFilters?.assigned_to_me === true;

  if (!currentUser) return null;

  const label = t("common.you");

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      title={label}
      onClick={() => handleDisplayFiltersUpdate({ assigned_to_me: !isActive })}
      className={cn(
        "inline-flex size-7 items-center justify-center gap-1 rounded-md border border-strong bg-layer-2 text-secondary shadow-raised-100 transition-colors hover:bg-layer-2-hover focus:bg-layer-2-active active:bg-layer-2-active",
        {
          "border-accent-subtle-1": isActive,
        }
      )}
    >
      <Avatar name={currentUser.display_name} src={getFileURL(currentUser.avatar_url)} showTooltip={false} size="sm" />
    </button>
  );
});
