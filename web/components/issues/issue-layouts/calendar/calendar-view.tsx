import React, { useRef } from "react";
import { DraggableLocation, DragDropContext, DropResult } from "@hello-pangea/dnd";
import { observer } from "mobx-react-lite";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import {
  TIssue,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueMap,
  TGroupedIssues,
  IIssueFilterOptions,
  TIssueMap,
  TIssueKanbanFilters,
} from "@plane/types";
// components
import { Spinner, TOAST_TYPE, setToast } from "@plane/ui";
import { CalendarChart } from "@/components/issues";
import { useProject } from "@/hooks/store";
import { TRenderQuickActions } from "../list/list-view-types";
import { handleDragDrop } from "./utils";
import { IWorkspaceIssuesFilter } from "@/store/issue/workspace";
// types
//hooks

type Props = {
  // displayProperties: IIssueDisplayProperties;
  // displayFilters: IIssueDisplayFilterOptions;
  // handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  // issueIds: string[] | undefined;
  // quickActions: TRenderQuickActions;
  // updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  // openIssuesListModal?: (() => void) | null;
  // quickAddCallback?: (
  //   workspaceSlug: string,
  //   projectId: string,
  //   data: TIssue,
  //   viewId?: string
  // ) => Promise<TIssue | undefined>;
  // viewId?: string;
  // canEditProperties: (projectId: string | undefined) => boolean;
  // enableQuickCreateIssue?: boolean;
  // disableIssueCreation?: boolean;
  // isWorkspaceLevel?: boolean;

  // issues
  issuesFilterStore: IWorkspaceIssuesFilter,
  issues: TIssueMap,
  // issueIds: string[],
  groupedIssueIds: TGroupedIssues,
  // Layout
  // layout: "month" | "week" | undefined;
  // showWeekends: boolean;
  // handlers
  quickActions: TRenderQuickActions;
  quickAddIssues?: (
  // quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  // handleDisplayFilterUpdate?: (
  //   projectId: string,
  //   filterType: EIssueFilterType,
  //   filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
  // ) => Promise<void>;
  // updateIssue?: (projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  viewId?: string;
  readOnly?: boolean;
  updateFilters?: (
    projectId: string,
    filterType: EIssueFilterType,
    filters: IIssueFilterOptions | IIssueDisplayFilterOptions | IIssueDisplayProperties | TIssueKanbanFilters
  ) => Promise<void>
  isWorkspaceLevel?: boolean;
  // handleDragDrop?: (
  //   source: DraggableLocation,
  //   destination: DraggableLocation,
  //   workspaceSlug: string | undefined,
  //   projectId: string | undefined,
  //   issueMap: IIssueMap,
  //   issueWithIds: TGroupedIssues,
  //   updateIssue?: ((projectId: string, issueId: string, data: TIssue) => Promise<void>) | undefined
  // ) => Promise<void>
};

export const CalendarView: React.FC<Props> = observer((props: Props) => {
  const {
    issuesFilterStore,
    issues,
    groupedIssueIds,
    // layout,
    // showWeekends,
    quickActions,
    quickAddIssues,
    // updateIssue,
    addIssuesToView,
    viewId,
    readOnly,
    updateFilters,
    isWorkspaceLevel = true
  } = props;
  // refs
  const containerRef = useRef<HTMLTableElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  const { currentProjectDetails } = useProject();

  const isEstimateEnabled: boolean = currentProjectDetails?.estimate !== null;

  const displayFilters = issuesFilterStore.issueFilters.displayFilters;
  console.log("CalendarView.displayFilters", displayFilters)

  const onDragEnd = async (result: DropResult) => {
    if (!result) return;

    // return if not dropped on the correct place
    if (!result.destination) return;

    // return if dropped on the same date
    if (result.destination.droppableId === result.source.droppableId) return;

    if (handleDragDrop) {
      await handleDragDrop
    }
  };

  return (
    <div className="relative flex flex-col h-full w-full overflow-x-hidden whitespace-nowrap rounded-lg bg-custom-background-200 text-custom-text-200">
      <div ref={containerRef} className="vertical-scrollbar horizontal-scrollbar scrollbar-lg h-full w-full bg-custom-background-100 pt-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <CalendarChart
            issuesFilterStore={issuesFilterStore}
            issues={issues}
            groupedIssueIds={groupedIssueIds}
            layout={displayFilters?.calendar?.layout}
            showWeekends={displayFilters?.calendar?.show_weekends ?? false}
            quickActions={quickActions}
            quickAddIssue={quickAddIssues}
            addIssuesToView={addIssuesToView}
            viewId={viewId}
            // readOnly={!isEditingAllowed || isCompletedCycle}
            readOnly={readOnly}
            updateFilters={updateFilters}
          />
        </DragDropContext>
      </div>
    </div>
  );
});
