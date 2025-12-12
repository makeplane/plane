import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
// ui
import { SITES_ISSUE_LAYOUTS } from "@plane/constants";
// plane i18n
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { useIssueFilter } from "@/hooks/store/use-issue-filter";
// mobx
import type { TIssueLayout } from "@/types/issue";
import { IssueLayoutIcon } from "./layout-icon";

type Props = {
  anchor: string;
};

export const IssuesLayoutSelection = observer(function IssuesLayoutSelection(props: Props) {
  const { anchor } = props;
  // hooks
  const { t } = useTranslation();
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
    <div className="flex items-center gap-1 rounded-sm bg-layer-2 p-1">
      {SITES_ISSUE_LAYOUTS.map((layout) => {
        if (!layoutOptions[layout.key]) return;

        return (
          <Tooltip key={layout.key} tooltipContent={t(layout.titleTranslationKey)}>
            <button
              type="button"
              className={`group grid h-[22px] w-7 place-items-center overflow-hidden rounded-sm transition-all bg-layer-transparent hover:bg-layer-transparent-hover ${
                activeLayout == layout.key ? "bg-layer-transparent-active hover:bg-layer-transparent-selected" : ""
              }`}
              onClick={() => handleCurrentBoardView(layout.key)}
            >
              <IssueLayoutIcon
                layout={layout.key}
                className={`size-3.5 ${activeLayout == layout.key ? "text-primary" : "text-secondary"}`}
              />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
});
