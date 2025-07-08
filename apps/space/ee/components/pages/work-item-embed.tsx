import { observer } from "mobx-react";
import { AlertTriangle } from "lucide-react";
// ui
import { Loader } from "@plane/ui";
// components
import { IssueBlockDate, IssueBlockPriority, IssueBlockState } from "@/components/issues";
// hooks
import { usePublish } from "@/hooks/store";
// plane web hooks
import { usePage } from "@/plane-web/hooks/store";

type Props = {
  anchor: string;
  issueId: string;
};

export const WorkItemEmbedCard: React.FC<Props> = observer((props) => {
  const { anchor, issueId } = props;
  // store hooks
  const pageDetails = usePage(anchor);
  const { project_details } = usePublish(anchor);

  if (!pageDetails) return null;

  // derived values
  const { areIssueEmbedsLoaded, getIssueEmbedDetails, issueEmbedError } = pageDetails;
  const issueDetails = getIssueEmbedDetails(issueId);
  const stateDetails = issueDetails?.state_detail;

  if (!areIssueEmbedsLoaded && !issueEmbedError)
    return (
      <Loader className="rounded-md bg-custom-background-90 p-3 my-2">
        <Loader.Item height="30px" />
        <div className="mt-3 space-y-2">
          <Loader.Item height="20px" width="70%" />
          <Loader.Item height="20px" width="60%" />
        </div>
      </Loader>
    );

  if (issueEmbedError)
    return (
      <div className="flex items-center gap-2 rounded-md border border-orange-500 bg-orange-500/10 text-orange-500 px-4 py-3 my-2">
        <AlertTriangle className="text-orange-500 size-5" />
        <p className="!text-sm">We encountered an error while fetching the embedded work item details.</p>
      </div>
    );

  if (!issueDetails)
    return (
      <div className="flex items-center gap-2 rounded-md border border-orange-500 bg-orange-500/10 text-orange-500 px-4 py-3 my-2">
        <AlertTriangle className="text-orange-500 size-5" />
        <p className="!text-sm">This Work item embed could not be found. It might have been deleted.</p>
      </div>
    );

  return (
    <div className="issue-embed space-y-2 rounded-md bg-custom-background-90 p-3 my-2">
      <h5 className="!text-xs !font-normal !mt-0 text-custom-text-300">
        {project_details?.identifier}-{issueDetails?.sequence_id}
      </h5>
      <h4 className="!text-sm !font-medium !mt-1 line-clamp-2 break-words">{issueDetails?.name}</h4>
      <div className="hide-horizontal-scrollbar relative flex w-full flex-grow items-end gap-2 overflow-x-scroll">
        {/* state */}
        {stateDetails && (
          <div className="flex-shrink-0 h-5">
            <IssueBlockState stateId={stateDetails.id} />
          </div>
        )}
        {/* priority */}
        {issueDetails?.priority && (
          <div className="flex-shrink-0 h-5">
            <IssueBlockPriority priority={issueDetails?.priority} />
          </div>
        )}
        {/* due date */}
        {issueDetails?.target_date && (
          <div className="flex-shrink-0 h-5">
            <IssueBlockDate due_date={issueDetails?.target_date} stateId={stateDetails?.id} />
          </div>
        )}
      </div>
    </div>
  );
});
