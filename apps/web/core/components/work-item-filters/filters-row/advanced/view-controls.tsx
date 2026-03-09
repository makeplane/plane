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

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { PQLEditorHandle } from "@plane/editor";
import { Button } from "@plane/propel/button";
// components
import { RichFiltersViewControls } from "@/components/rich-filters/view-controls";
// local imports
import type { TSharedWorkItemFiltersHOCChildrenProps } from "../../filters-hoc/shared";

type Props = TSharedWorkItemFiltersHOCChildrenProps & {
  pqlEditorRef?: React.RefObject<PQLEditorHandle>;
};

export const WorkItemAdvancedFiltersRowViewControls = observer(function WorkItemAdvancedFiltersRowViewControls({
  filter,
  pqlEditorRef,
}: Props) {
  // states
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  // derived values
  const { saveViewOptions, updateViewOptions } = filter?.viewOptions ?? {};
  const canPerformAnyOperation = filter?.canClearFilters || filter?.canSaveView || filter?.canUpdateView;

  const handleSaveView = useCallback(async () => {
    try {
      setIsSaving(true);
      await filter?.saveView();
    } finally {
      setIsSaving(false);
    }
  }, [filter]);

  const handleUpdateView = useCallback(async () => {
    try {
      setIsUpdating(true);
      await filter?.updateView();
    } finally {
      setIsUpdating(false);
    }
  }, [filter]);

  if (!canPerformAnyOperation) return null;

  return (
    <div className="shrink-0 flex items-center gap-2">
      {filter.canClearFilters && (
        <Button
          variant="ghost"
          onClick={() => {
            if (filter.lastUsedFilterType === "rich_filters") {
              void filter.clearFilters();
            } else if (filter.lastUsedFilterType === "pql_filters") {
              pqlEditorRef?.current?.clearAll({
                triggerSubmit: true,
              });
            }
          }}
          className="shrink-0"
        >
          Clear all
        </Button>
      )}
      {filter.viewOptions && (
        <RichFiltersViewControls
          save={{
            callback: handleSaveView,
            enabled: filter.canSaveView,
            isSaving,
            label: saveViewOptions?.label,
          }}
          update={{
            callback: handleUpdateView,
            enabled: filter.canUpdateView,
            isUpdating,
            label: updateViewOptions?.label,
          }}
        />
      )}
    </div>
  );
});
