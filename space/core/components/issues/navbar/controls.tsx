"use client";

import { useEffect, FC } from "react";
import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
// components
import { IssuesLayoutSelection, NavbarTheme, UserAvatar } from "@/components/issues";
import { IssueFiltersDropdown } from "@/components/issues/filters";
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { useIssueFilter, useIssueDetails } from "@/hooks/store";
import useIsInIframe from "@/hooks/use-is-in-iframe";
// store
import { PublishStore } from "@/store/publish/publish.store";
// types
import { TIssueLayout } from "@/types/issue";

export type NavbarControlsProps = {
  publishSettings: PublishStore;
};

export const NavbarControls: FC<NavbarControlsProps> = observer((props) => {
  // props
  const { publishSettings } = props;
  // router
  const router = useRouter();
  const searchParams = useSearchParams();
  // query params
  const board = searchParams.get("board") || undefined;
  const labels = searchParams.get("labels") || undefined;
  const state = searchParams.get("state") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const peekId = searchParams.get("peekId") || undefined;
  // hooks
  const { getIssueFilters, isIssueFiltersUpdated, initIssueFilters } = useIssueFilter();
  const { setPeekId } = useIssueDetails();
  // derived values
  const { anchor, view_props, workspace_detail } = publishSettings;
  const issueFilters = anchor ? getIssueFilters(anchor) : undefined;
  const activeLayout = issueFilters?.display_filters?.layout || undefined;

  const isInIframe = useIsInIframe();

  useEffect(() => {
    if (anchor && workspace_detail) {
      const viewsAcceptable: string[] = [];
      let currentBoard: TIssueLayout | null = null;

      if (view_props?.list) viewsAcceptable.push("list");
      if (view_props?.kanban) viewsAcceptable.push("kanban");
      if (view_props?.calendar) viewsAcceptable.push("calendar");
      if (view_props?.gantt) viewsAcceptable.push("gantt");
      if (view_props?.spreadsheet) viewsAcceptable.push("spreadsheet");

      if (board) {
        if (viewsAcceptable.includes(board.toString())) currentBoard = board.toString() as TIssueLayout;
        else {
          if (viewsAcceptable && viewsAcceptable.length > 0) currentBoard = viewsAcceptable[0] as TIssueLayout;
        }
      } else {
        if (viewsAcceptable && viewsAcceptable.length > 0) currentBoard = viewsAcceptable[0] as TIssueLayout;
      }

      if (currentBoard) {
        if (activeLayout === undefined || activeLayout !== currentBoard) {
          const { query, queryParam } = queryParamGenerator({ board: currentBoard, peekId, priority, state, labels });
          const params: any = {
            display_filters: { layout: (query?.board as string[])[0] },
            filters: {
              priority: query?.priority ?? undefined,
              state: query?.state ?? undefined,
              labels: query?.labels ?? undefined,
            },
          };

          if (!isIssueFiltersUpdated(anchor, params)) {
            initIssueFilters(anchor, params);
            router.push(`/issues/${anchor}?${queryParam}`);
          }
        }
      }
    }
  }, [
    anchor,
    board,
    labels,
    state,
    priority,
    peekId,
    activeLayout,
    router,
    initIssueFilters,
    setPeekId,
    isIssueFiltersUpdated,
    view_props,
    workspace_detail,
  ]);

  if (!anchor) return null;

  return (
    <>
      {/* issue views */}
      <div className="relative flex flex-shrink-0 items-center gap-1 transition-all delay-150 ease-in-out">
        <IssuesLayoutSelection anchor={anchor} />
      </div>

      {/* issue filters */}
      <div className="relative flex flex-shrink-0 items-center gap-1 transition-all delay-150 ease-in-out">
        <IssueFiltersDropdown anchor={anchor} />
      </div>

      {/* theming */}
      <div className="relative flex-shrink-0">
        <NavbarTheme />
      </div>

      {!isInIframe && <UserAvatar />}
    </>
  );
});
