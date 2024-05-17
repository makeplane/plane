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
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
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
          const { query, queryParam } = queryParamGenerator({ board: currentBoard, peekId, priority, state, labels });
          const params: any = {
            display_filters: { layout: (query?.board as string[])[0] },
            filters: {
              priority: query?.priority ?? undefined,
              state: query?.state ?? undefined,
              labels: query?.labels ?? undefined,
            },
          };

          if (!isIssueFiltersUpdated(params)) {
            initIssueFilters(projectId, params);
            router.push(`/${workspaceSlug}/${projectId}?${queryParam}`);
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
          <h6 className="text-xs font-medium">
            {user?.display_name || `${user?.first_name} ${user?.first_name}` || user?.email || "User"}
          </h6>
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
