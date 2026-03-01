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

import type { FC } from "react";
import { observer } from "mobx-react";
import { ArrowRight } from "lucide-react";
// helpers
import { renderFormattedDate } from "@plane/utils";
// plane web components
import { AppliedFilterGroup, AppliedFilterGroupItem } from "@/components/worklogs";
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

type TWorkspaceWorklogAppliedFilterDateRange = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogAppliedFilterDateRange = observer(function WorkspaceWorklogAppliedFilterDateRange(
  props: TWorkspaceWorklogAppliedFilterDateRange
) {
  const { workspaceSlug } = props;
  // hooks
  const { filters, updateFilters } = useWorkspaceWorklogs();

  // derived values
  const selectedIds = filters.created_at;

  if (selectedIds.length <= 0) return <></>;

  const handleSelectedOptions = () => {
    updateFilters(workspaceSlug, "created_at", []);
  };

  return (
    <AppliedFilterGroup groupTitle="Date" onClear={handleSelectedOptions}>
      <AppliedFilterGroupItem>
        <div className="truncate text-11 flex items-center gap-2">
          <div>{renderFormattedDate(selectedIds[0].split(";")[0])}</div>
          <ArrowRight size={10} />
          <div>{renderFormattedDate(selectedIds[1].split(";")[0])}</div>
        </div>
      </AppliedFilterGroupItem>
    </AppliedFilterGroup>
  );
});
