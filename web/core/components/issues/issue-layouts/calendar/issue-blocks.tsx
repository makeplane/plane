import { observer } from "mobx-react";
import { TIssue, TPaginationData } from "@plane/types";
// components
import { CalendarQuickAddIssueForm, CalendarIssueBlockRoot } from "@/components/issues";
// helpers
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";
import { TRenderQuickActions } from "../list/list-view-types";
import { useState } from "react";
// types

type Props = {
  date: Date;
  issueIdList: string[];
  quickActions: TRenderQuickActions;
  isDragDisabled?: boolean;
  enableQuickIssueCreate?: boolean;
  disableIssueCreation?: boolean;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  readOnly?: boolean;
  isMobileView?: boolean;
};

export const CalendarIssueBlocks: React.FC<Props> = observer((props) => {
  const {
    date,
    issueIdList,
    quickActions,
    isDragDisabled = false,
    enableQuickIssueCreate,
    disableIssueCreation,
    quickAddCallback,
    addIssuesToView,
    readOnly,
    isMobileView = false,
  } = props;
  const formattedDatePayload = renderFormattedPayloadDate(date);

  const [isExpanded, setIsExpanded] = useState(isMobileView);

  if (!formattedDatePayload) return null;

  const dayIssueCount = issueIdList?.length ?? 0;

  const currentIssueIds = isExpanded ? issueIdList : issueIdList?.slice(0, 4);

  return (
    <>
      {currentIssueIds?.map((issueId) => (
        <div key={issueId} className="relative cursor-pointer p-1 px-2">
          <CalendarIssueBlockRoot
            issueId={issueId}
            quickActions={quickActions}
            isDragDisabled={isDragDisabled || isMobileView}
          />
        </div>
      ))}

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
          />
        </div>
      )}

      {!isExpanded && dayIssueCount > 4 && (
        <div className="flex items-center px-2.5 py-1">
          <button
            type="button"
            className="w-min whitespace-nowrap rounded text-xs px-1.5 py-1 font-medium  hover:bg-custom-background-80 text-custom-primary-100 hover:text-custom-primary-200"
            onClick={() => setIsExpanded(true)}
          >
            Load More
          </button>
        </div>
      )}
    </>
  );
});
