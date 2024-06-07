"use client";

import { FC } from "react";
import { observer } from "mobx-react-lite";
import { useRouter, useSearchParams } from "next/navigation";
// constants
import { issueLayoutViews } from "@/constants/issue";
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { useIssueFilter } from "@/hooks/store";
// mobx
import { TIssueLayout } from "@/types/issue";

type NavbarIssueBoardViewProps = {
  workspaceSlug: string;
  projectId: string;
};

export const NavbarIssueBoardView: FC<NavbarIssueBoardViewProps> = observer((props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  // query params
  const labels = searchParams.get("labels") || undefined;
  const state = searchParams.get("state") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const peekId = searchParams.get("peekId") || undefined;
  // props
  const { workspaceSlug, projectId } = props;
  // hooks
  const { layoutOptions, issueFilters, updateIssueFilters } = useIssueFilter();

  // derived values
  const activeLayout = issueFilters?.display_filters?.layout || undefined;

  const handleCurrentBoardView = (boardView: TIssueLayout) => {
    updateIssueFilters(projectId, "display_filters", "layout", boardView);
    const { queryParam } = queryParamGenerator({ board: boardView, peekId, priority, state, labels });
    router.push(`/${workspaceSlug}/${projectId}?${queryParam}`);
  };

  return (
    <>
      {issueLayoutViews &&
        Object.keys(issueLayoutViews).map((key: string) => {
          const layoutKey = key as TIssueLayout;
          if (layoutOptions[layoutKey]) {
            return (
              <div
                key={layoutKey}
                className={`flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-sm ${
                  layoutKey === activeLayout
                    ? `bg-custom-background-80 text-custom-text-200`
                    : `text-custom-text-300 hover:bg-custom-background-80`
                }`}
                onClick={() => handleCurrentBoardView(layoutKey)}
                title={layoutKey}
              >
                <span
                  className={`material-symbols-rounded text-[18px] ${
                    issueLayoutViews[layoutKey]?.className ? issueLayoutViews[layoutKey]?.className : ``
                  }`}
                >
                  {issueLayoutViews[layoutKey]?.icon}
                </span>
              </div>
            );
          }
        })}
    </>
  );
});
