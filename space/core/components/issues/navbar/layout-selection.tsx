"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
// ui
import { Tooltip } from "@plane/ui";
// constants
import { ISSUE_LAYOUTS } from "@/constants/issue";
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { useIssueFilter } from "@/hooks/store";
// mobx
import { TIssueLayout } from "@/types/issue";

type Props = {
  anchor: string;
};

export const IssuesLayoutSelection: FC<Props> = observer((props) => {
  const { anchor } = props;
  // router
  const router = useRouter();
  const searchParams = useSearchParams();
  // query params
  const labels = searchParams.get("labels");
  const state = searchParams.get("state");
  const priority = searchParams.get("priority");
  const peekId = searchParams.get("peekId");
  // hooks
  const { layoutOptions, getIssueFilters, updateIssueFilters } = useIssueFilter();
  // derived values
  const issueFilters = getIssueFilters(anchor);
  const activeLayout = issueFilters?.display_filters?.layout || undefined;

  const handleCurrentBoardView = (boardView: TIssueLayout) => {
    updateIssueFilters(anchor, "display_filters", "layout", boardView);
    const { queryParam } = queryParamGenerator({ board: boardView, peekId, priority, state, labels });
    router.push(`/issues/${anchor}?${queryParam}`);
  };

  return (
    <div className="flex items-center gap-1 rounded bg-custom-background-80 p-1">
      {ISSUE_LAYOUTS.map((layout) => {
        if (!layoutOptions[layout.key]) return;

        return (
          <Tooltip key={layout.key} tooltipContent={layout.title}>
            <button
              type="button"
              className={`group grid h-[22px] w-7 place-items-center overflow-hidden rounded transition-all hover:bg-custom-background-100 ${
                activeLayout == layout.key ? "bg-custom-background-100 shadow-custom-shadow-2xs" : ""
              }`}
              onClick={() => handleCurrentBoardView(layout.key)}
            >
              <layout.icon
                strokeWidth={2}
                className={`size-3.5 ${activeLayout == layout.key ? "text-custom-text-100" : "text-custom-text-200"}`}
              />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
});
