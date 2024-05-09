import { Dispatch, SetStateAction } from "react";
import { observer } from "mobx-react-lite";
// types
import { TIssue, TIssueMap } from "@plane/types";
// components
import { CalendarQuickAddIssueForm, CalendarIssueBlockRoot } from "@/components/issues";
// helpers
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { TRenderQuickActions } from "../list/list-view-types";
// types

type Props = {
  date: Date;
  issues: TIssueMap | undefined;
  issueIdList: string[] | null;
  showAllIssues: boolean;
  setShowAllIssues?: Dispatch<SetStateAction<boolean>>;
  isMonthLayout: boolean;
  quickActions: TRenderQuickActions;
  isDragDisabled?: boolean;
  enableQuickIssueCreate?: boolean;
  disableIssueCreation?: boolean;
  quickAddCallback?: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    viewId?: string
  ) => Promise<TIssue | undefined>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  viewId?: string;
  readOnly?: boolean;
  isMobileView?: boolean;
};

export const CalendarIssueBlocks: React.FC<Props> = observer((props) => {
  const {
    date,
    issues,
    issueIdList,
    showAllIssues,
    setShowAllIssues,
    quickActions,
    isDragDisabled = false,
    enableQuickIssueCreate,
    disableIssueCreation,
    quickAddCallback,
    addIssuesToView,
    viewId,
    readOnly,
    isMonthLayout,
    isMobileView = false,
  } = props;

  const formattedDatePayload = renderFormattedPayloadDate(date);
  const totalIssues = issueIdList?.length ?? 0;

  if (!formattedDatePayload) return null;

  return (
    <>
      {issueIdList?.slice(0, showAllIssues || !isMonthLayout ? issueIdList.length : 4).map((issueId) => (
        <div key={issueId} className="relative cursor-pointer p-1 px-2">
          <CalendarIssueBlockRoot
            issues={issues}
            issueId={issueId}
            quickActions={quickActions}
            isDragDisabled={isDragDisabled || isMobileView}
          />
        </div>
      ))}
      {totalIssues > 4 && isMonthLayout && (
        <div className="hidden items-center px-2.5 py-1 md:flex">
          <button
            type="button"
            className="w-min whitespace-nowrap rounded px-1.5 py-1 text-xs font-medium text-custom-text-400  hover:bg-custom-background-80 hover:text-custom-text-300"
            onClick={() => setShowAllIssues && setShowAllIssues(!showAllIssues)}
          >
            {showAllIssues ? "Hide" : totalIssues - 4 + " more"}
          </button>
        </div>
      )}
      {enableQuickIssueCreate && !disableIssueCreation && !readOnly && (
        <div className="border-b border-custom-border-200 px-1 py-1 md:border-none md:px-2">
          <CalendarQuickAddIssueForm
            formKey="target_date"
            groupId={formattedDatePayload}
            prePopulatedData={{
              target_date: formattedDatePayload,
            }}
            quickAddCallback={quickAddCallback}
            addIssuesToView={addIssuesToView}
            viewId={viewId}
            onOpen={() => setShowAllIssues && setShowAllIssues(true)}
          />
        </div>
      )}
    </>
  );
});
