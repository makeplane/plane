import { useRouter } from "next/router";
// components
import { IssueProperties } from "../properties/all-properties";
// ui
import { Spinner, Tooltip } from "@plane/ui";
// types
import { IIssue, IIssueDisplayProperties, IIssueMap } from "types";
import { EIssueActions } from "../types";

interface IssueBlockProps {
  issueId: string;
  issuesMap: IIssueMap;
  handleIssues: (issue: IIssue, action: EIssueActions) => void;
  quickActions: (issue: IIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  canEditProperties: (projectId: string | undefined) => boolean;
}

export const IssueBlock: React.FC<IssueBlockProps> = (props) => {
  const { issuesMap, issueId, handleIssues, quickActions, displayProperties, canEditProperties } = props;
  // router
  const router = useRouter();
  const updateIssue = (issueToUpdate: IIssue) => {
    handleIssues(issueToUpdate, EIssueActions.UPDATE);
  };

  const issue = issuesMap[issueId];

  if (!issue) return null;

  const handleIssuePeekOverview = () => {
    const { query } = router;

    router.push({
      pathname: router.pathname,
      query: { ...query, peekIssueId: issue?.id, peekProjectId: issue?.project },
    });
  };

  const canEditIssueProperties = canEditProperties(issue.project);

  return (
    <>
      <div className="relative flex items-center gap-3 bg-custom-background-100 p-3 text-sm">
        {displayProperties && displayProperties?.key && (
          <div className="flex-shrink-0 text-xs font-medium text-custom-text-300">
            {issue?.project_detail?.identifier}-{issue.sequence_id}
          </div>
        )}

        {issue?.tempId !== undefined && (
          <div className="absolute left-0 top-0 z-[99999] h-full w-full animate-pulse bg-custom-background-100/20" />
        )}
        <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
          <div
            className="line-clamp-1 w-full cursor-pointer text-sm font-medium text-custom-text-100"
            onClick={handleIssuePeekOverview}
          >
            {issue.name}
          </div>
        </Tooltip>

        <div className="ml-auto flex flex-shrink-0 items-center gap-2">
          {!issue?.tempId ? (
            <>
              <IssueProperties
                className="relative flex items-center gap-2 overflow-x-auto whitespace-nowrap"
                issue={issue}
                isReadOnly={!canEditIssueProperties}
                handleIssues={updateIssue}
                displayProperties={displayProperties}
              />
              {quickActions(issue)}
            </>
          ) : (
            <div className="h-4 w-4">
              <Spinner className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
