"use client";

import { useEffect, FC } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useRouter, useParams, useSearchParams, usePathname } from "next/navigation";
import useSWR from "swr";
// ui
import { Avatar, Button } from "@plane/ui";
// components
import { IssueFiltersDropdown } from "@/components/issues/filters";
// hooks
import { useProject, useUser, useIssueFilter } from "@/hooks/store";
// types
import { TIssueBoardKeys } from "@/types/issue";
// components
import { NavbarIssueBoardView } from "./issue-board-view";
import { NavbarTheme } from "./theme";

export type NavbarControlsProps = {
  workspaceSlug: string;
  projectId: string;
  projectSettings: any;
};

export const NavbarControls: FC<NavbarControlsProps> = observer((props) => {
  const { workspaceSlug, projectId, projectSettings } = props;
  const { views } = projectSettings;
  // router
  const router = useRouter();
  const { board, labels, states, priorities, peekId } = useParams<any>();
  const searchParams = useSearchParams();
  const pathName = usePathname();
  // store
  const { updateFilters } = useIssueFilter();
  const { settings, activeLayout, hydrate, setActiveLayout } = useProject();
  hydrate(projectSettings);

  const { data: user, fetchCurrentUser } = useUser();

  useSWR("CURRENT_USER", () => fetchCurrentUser(), { errorRetryCount: 2 });

  console.log("user", user);

  useEffect(() => {
    if (workspaceSlug && projectId && settings) {
      const viewsAcceptable: string[] = [];
      const currentBoard: TIssueBoardKeys | null = null;

      if (settings?.views?.list) viewsAcceptable.push("list");
      if (settings?.views?.kanban) viewsAcceptable.push("kanban");
      if (settings?.views?.calendar) viewsAcceptable.push("calendar");
      if (settings?.views?.gantt) viewsAcceptable.push("gantt");
      if (settings?.views?.spreadsheet) viewsAcceptable.push("spreadsheet");

      //     if (board) {
      //       if (viewsAcceptable.includes(board.toString())) {
      //         currentBoard = board.toString() as TIssueBoardKeys;
      //       } else {
      //         if (viewsAcceptable && viewsAcceptable.length > 0) {
      //           currentBoard = viewsAcceptable[0] as TIssueBoardKeys;
      //         }
      //       }
      //     } else {
      //       if (viewsAcceptable && viewsAcceptable.length > 0) {
      //         currentBoard = viewsAcceptable[0] as TIssueBoardKeys;
      //       }
      //     }

      if (currentBoard) {
        if (activeLayout === null || activeLayout !== currentBoard) {
          let params: any = { board: currentBoard };
          if (peekId && peekId.length > 0) params = { ...params, peekId: peekId };
          if (priorities && priorities.length > 0) params = { ...params, priorities: priorities };
          if (states && states.length > 0) params = { ...params, states: states };
          if (labels && labels.length > 0) params = { ...params, labels: labels };
          console.log("params", params);
          let storeParams: any = {};
          if (priorities && priorities.length > 0) storeParams = { ...storeParams, priority: priorities.split(",") };
          if (states && states.length > 0) storeParams = { ...storeParams, state: states.split(",") };
          if (labels && labels.length > 0) storeParams = { ...storeParams, labels: labels.split(",") };

          if (storeParams) updateFilters(projectId, storeParams);
          setActiveLayout(currentBoard);
          router.push(`/${workspaceSlug}/${projectId}?${searchParams}`);
        }
      }
    }
  }, [
    board,
    workspaceSlug,
    projectId,
    router,
    updateFilters,
    labels,
    states,
    priorities,
    peekId,
    settings,
    activeLayout,
    setActiveLayout,
    searchParams,
  ]);
  return (
    <>
      {/* issue views */}
      <div className="relative flex flex-shrink-0 items-center gap-1 transition-all delay-150 ease-in-out">
        <NavbarIssueBoardView layouts={views} />
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
