import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { useIssueDetail } from "@/hooks/store";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";

export const PowerKBreadcrumbs = observer(() => {
  // navigation
  const { issueId } = useParams();
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // derived values
  const issueDetails = issueId ? getIssueById(issueId.toString()) : undefined;

  if (issueId && issueDetails) {
    return (
      <div className="flex gap-4 p-3 pb-0 sm:items-center">
        <div className="flex gap-2 items-center overflow-hidden truncate rounded-md bg-custom-background-80 p-2 text-xs font-medium text-custom-text-200">
          {issueDetails.project_id && (
            <IssueIdentifier
              issueId={issueDetails.id}
              projectId={issueDetails.project_id}
              textContainerClassName="text-xs font-medium text-custom-text-200"
            />
          )}
          {issueDetails.name}
        </div>
      </div>
    );
  }

  return null;
});
