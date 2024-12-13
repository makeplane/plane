import { observer } from "mobx-react";
import { TPaginationData } from "@plane/types";
// helpers
import { renderFormattedPayloadDate } from "@/plane-web/helpers/date-time.helper";
// hooks
import { useViewIssues } from "@/plane-web/hooks/store";
// types
import { IIssue } from "@/types/issue";
//
import { CalendarIssueBlockRoot } from "./issue-block-root";

type Props = {
  date: Date;
  getIssueById: (issueId: string) => IIssue | undefined;
  loadMoreIssues: (dateString: string) => void;
  getPaginationData: (groupId: string | undefined) => TPaginationData | undefined;
  getGroupIssueCount: (groupId: string | undefined) => number | undefined;
  issueIdList: string[];
};

export const CalendarIssueBlocks: React.FC<Props> = observer((props) => {
  const { date, getIssueById, issueIdList, loadMoreIssues } = props;
  const formattedDatePayload = renderFormattedPayloadDate(date);

  const { getGroupIssueCount, getPaginationData, getIssueLoader } = useViewIssues();

  if (!formattedDatePayload) return null;

  const dayIssueCount = getGroupIssueCount(formattedDatePayload, undefined, false);
  const nextPageResults = getPaginationData(formattedDatePayload, undefined)?.nextPageResults;
  const isPaginating = !!getIssueLoader(formattedDatePayload);

  const shouldLoadMore =
    nextPageResults === undefined && dayIssueCount !== undefined
      ? issueIdList?.length < dayIssueCount
      : !!nextPageResults;

  return (
    <>
      {issueIdList?.map((issueId) => (
        <div key={issueId} className="relative cursor-pointer p-1 px-2">
          <CalendarIssueBlockRoot getIssueById={getIssueById} issueId={issueId} />
        </div>
      ))}

      {isPaginating && (
        <div className="p-1 px-2">
          <div className="flex h-10 md:h-8 w-full items-center justify-between gap-1.5 rounded md:px-1 px-4 py-1.5 bg-custom-background-80 animate-pulse" />
        </div>
      )}

      {shouldLoadMore && !isPaginating && (
        <div className="flex items-center px-2.5 py-1">
          <button
            type="button"
            className="w-min whitespace-nowrap rounded text-xs px-1.5 py-1 text-custom-text-400 font-medium  hover:bg-custom-background-80 hover:text-custom-text-300"
            onClick={() => loadMoreIssues(formattedDatePayload)}
          >
            Load More
          </button>
        </div>
      )}
    </>
  );
});
