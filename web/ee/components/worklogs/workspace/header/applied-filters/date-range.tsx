"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { ArrowRight } from "lucide-react";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
// plane web components
import { AppliedFilterGroup, AppliedFilterGroupItem } from "@/plane-web/components/worklogs";
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

type TWorkspaceWorklogAppliedFilterDateRange = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogAppliedFilterDateRange: FC<TWorkspaceWorklogAppliedFilterDateRange> = observer((props) => {
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
        <div className="truncate text-xs flex items-center gap-2">
          <div>{renderFormattedDate(selectedIds[0].split(";")[0])}</div>
          <ArrowRight size={10} />
          <div>{renderFormattedDate(selectedIds[1].split(";")[0])}</div>
        </div>
      </AppliedFilterGroupItem>
    </AppliedFilterGroup>
  );
});
