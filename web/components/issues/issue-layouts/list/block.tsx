import { observer } from "mobx-react-lite";
// components
import { IssueProperties } from "../properties/all-properties";
// hooks
import { useApplication, useIssueDetail, useProject } from "hooks/store";
// ui
import { Spinner, Tooltip, ControlLink } from "@plane/ui";
// helper
import { cn } from "helpers/common.helper";
// types
import { TIssue, IIssueDisplayProperties, TIssueMap } from "@plane/types";
import { EIssueActions } from "../types";

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
  // hooks
  const {
    router: { workspaceSlug, projectId },
  } = useApplication();
  const { getProjectById } = useProject();
  const { peekIssue, setPeekIssue } = useIssueDetail();

  const updateIssue = (issueToUpdate: TIssue) => {
    handleIssues(issueToUpdate, EIssueActions.UPDATE);
  };

  const handleIssuePeekOverview = (issue: TIssue) =>
    workspaceSlug &&
    issue &&
    issue.project_id &&
    issue.id &&
    setPeekIssue({ workspaceSlug, projectId: issue.project_id, issueId: issue.id });

  const issue = issuesMap[issueId];

  if (!issue) return null;

  const canEditIssueProperties = canEditProperties(issue.project_id);
  const projectDetails = getProjectById(issue.project_id);

  return (
    <>
      <div
        className={cn(
          "relative flex items-center gap-3 bg-custom-background-100 p-3 text-sm border border-transparent border-b-custom-border-200 last:border-b-transparent",
          {
            "border border-custom-primary-70 hover:border-custom-primary-70":
              peekIssue && peekIssue.issueId === issue.id,
          }
        )}
      >
        {displayProperties && displayProperties?.key && (
          <div className="flex-shrink-0 text-xs font-medium text-custom-text-300">
            {projectDetails?.identifier}-{issue.sequence_id}
          </div>
        )}

        {issue?.tempId !== undefined && (
          <div className="absolute left-0 top-0 z-[99999] h-full w-full animate-pulse bg-custom-background-100/20" />
        )}

        <ControlLink
          href={`/${workspaceSlug}/projects/${projectId}/issues/${issueId}`}
          target="_blank"
          onClick={() => handleIssuePeekOverview(issue)}
          className="w-full line-clamp-1 cursor-pointer text-sm text-custom-text-100"
        >
          <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
            <span>{issue.name}</span>
          </Tooltip>
        </ControlLink>

        <div className="ml-auto flex flex-shrink-0 items-center gap-2">
          {!issue?.tempId ? (
            <>
              <IssueProperties
                className="relative flex items-center gap-2 whitespace-nowrap"
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
