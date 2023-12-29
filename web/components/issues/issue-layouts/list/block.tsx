import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// components
import { IssueProperties } from "../properties/all-properties";
// ui
import { Spinner, Tooltip } from "@plane/ui";
// types
import { TIssue, IIssueDisplayProperties, TIssueMap } from "@plane/types";
import { EIssueActions } from "../types";
import { useProject } from "hooks/store";

interface IssueBlockProps {
  issueId: string;
  issuesMap: TIssueMap;
  handleIssues: (issue: TIssue, action: EIssueActions) => void;
  quickActions: (issue: TIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  canEditProperties: (projectId: string | undefined) => boolean;
}

export const IssueBlock: React.FC<IssueBlockProps> = observer((props: IssueBlockProps) => {
  const { issuesMap, issueId, handleIssues, quickActions, displayProperties, canEditProperties } = props;
  // router
  const router = useRouter();
  const updateIssue = (issueToUpdate: TIssue) => {
    handleIssues(issueToUpdate, EIssueActions.UPDATE);
  };

  const issue = issuesMap[issueId];

  if (!issue) return null;

  const handleIssuePeekOverview = () => {
    const { query } = router;

    router.push({
      pathname: router.pathname,
      query: { ...query, peekIssueId: issue?.id, peekProjectId: issue?.project_id },
    });
  };

  const canEditIssueProperties = canEditProperties(issue.project_id);
  const { getProjectById } = useProject();
  const projectDetails = getProjectById(issue.project_id);

  return (
    <>
      <div className="relative flex items-center gap-3 bg-custom-background-100 p-3 text-sm">
        {displayProperties && displayProperties?.key && (
          <div className="flex-shrink-0 text-xs font-medium text-custom-text-300">
            {projectDetails?.identifier}-{issue.sequence_id}
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
});
