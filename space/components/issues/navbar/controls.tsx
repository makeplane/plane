"use client";

import { useEffect, FC } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
// ui
import { Avatar, Button } from "@plane/ui";
// components
import { IssueFiltersDropdown } from "@/components/issues/filters";
import { NavbarIssueBoardView } from "@/components/issues/navbar/issue-board-view";
import { NavbarTheme } from "@/components/issues/navbar/theme";
// hooks
import { useProject, useUser, useIssueFilter, useIssueDetails } from "@/hooks/store";
// types
import { TIssueLayout } from "@/types/issue";

export type NavbarControlsProps = {
  workspaceSlug: string;
  projectId: string;
};

export const NavbarControls: FC<NavbarControlsProps> = observer((props) => {
  // props
  const { workspaceSlug, projectId } = props;
  // router
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  // query params
  const board = searchParams.get("board") || undefined;
  const labels = searchParams.get("labels") || undefined;
  const state = searchParams.get("state") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const peekId = searchParams.get("peekId") || undefined;
  // hooks
  const { issueFilters, isIssueFiltersUpdated, initIssueFilters } = useIssueFilter();
  const { settings } = useProject();
  const { data: user } = useUser();
  const { setPeekId } = useIssueDetails();
  // derived values
  const activeLayout = issueFilters?.display_filters?.layout || undefined;

  useEffect(() => {
    if (workspaceSlug && projectId && settings) {
      const viewsAcceptable: string[] = [];
      let currentBoard: TIssueLayout | null = null;

      if (settings?.views?.list) viewsAcceptable.push("list");
      if (settings?.views?.kanban) viewsAcceptable.push("kanban");
      if (settings?.views?.calendar) viewsAcceptable.push("calendar");
      if (settings?.views?.gantt) viewsAcceptable.push("gantt");
      if (settings?.views?.spreadsheet) viewsAcceptable.push("spreadsheet");

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
          let queryParams: any = { board: currentBoard };
          const params: any = { display_filters: { layout: currentBoard }, filters: {} };

          if (peekId && peekId.length > 0) {
            queryParams = { ...queryParams, peekId: peekId };
            setPeekId(peekId);
          }
          if (priority && priority.length > 0) {
            queryParams = { ...queryParams, priority: priority };
            params.filters = { ...params.filters, priority: priority.split(",") };
          }
          if (state && state.length > 0) {
            queryParams = { ...queryParams, state: state };
            params.filters = { ...params.filters, state: state.split(",") };
          }
          if (labels && labels.length > 0) {
            queryParams = { ...queryParams, labels: labels };
            params.filters = { ...params.filters, labels: labels.split(",") };
          }

          if (!isIssueFiltersUpdated(params)) {
            initIssueFilters(projectId, params);
            queryParams = new URLSearchParams(queryParams).toString();
            router.push(`/${workspaceSlug}/${projectId}?${queryParams}`);
          }
        }
      }
    }
  }, [
    workspaceSlug,
    projectId,
    board,
    labels,
    state,
    priority,
    peekId,
    settings,
    activeLayout,
    router,
    initIssueFilters,
    setPeekId,
    isIssueFiltersUpdated,
  ]);

  return (
    <>
      {/* issue views */}
      <div className="relative flex flex-shrink-0 items-center gap-1 transition-all delay-150 ease-in-out">
        <NavbarIssueBoardView workspaceSlug={workspaceSlug} projectId={projectId} />
      </div>

      {/* issue filters */}
      <div className="relative flex flex-shrink-0 items-center gap-1 transition-all delay-150 ease-in-out">
        <IssueFiltersDropdown workspaceSlug={workspaceSlug} projectId={projectId} />
      </div>

      {/* theming */}
      <div className="relative flex-shrink-0">
        <NavbarTheme />
      </div>

      {user?.id ? (
        <div className="flex items-center gap-2 rounded border border-custom-border-200 p-2">
          <Avatar name={user?.display_name} src={user?.avatar ?? undefined} shape="square" size="sm" />
          <h6 className="text-xs font-medium">{user.display_name}</h6>
        </div>
      ) : (
        <div className="flex-shrink-0">
          <Link href={`/?next_path=${pathName}`}>
            <Button variant="outline-primary">Sign in</Button>
          </Link>
        </div>
      )}
    </>
  );
});
