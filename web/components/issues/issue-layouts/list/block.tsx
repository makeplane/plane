import { observer } from "mobx-react-lite";
import { TIssue, IIssueDisplayProperties, TIssueMap } from "@plane/types";
// components
// hooks
// ui
import { Spinner, Tooltip, ControlLink } from "@plane/ui";
// helper
import { cn } from "@/helpers/common.helper";
import { useApplication, useIssueDetail, useProject } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// types
import { IssueProperties } from "../properties/all-properties";

interface IssueBlockProps {
  issueId: string;
  issuesMap: TIssueMap;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: (issue: TIssue) => React.ReactNode;
  displayProperties: IIssueDisplayProperties | undefined;
  canEditProperties: (projectId: string | undefined) => boolean;
}

export const IssueBlock: React.FC<IssueBlockProps> = observer((props: IssueBlockProps) => {
  const { issuesMap, issueId, updateIssue, quickActions, displayProperties, canEditProperties } = props;
  // hooks
  const {
    router: { workspaceSlug },
  } = useApplication();
  const { getProjectIdentifierById } = useProject();
  const { peekIssue, setPeekIssue } = useIssueDetail();

  const handleIssuePeekOverview = (issue: TIssue) =>
    workspaceSlug &&
    issue &&
    issue.project_id &&
    issue.id &&
    setPeekIssue({ workspaceSlug, projectId: issue.project_id, issueId: issue.id });

  const issue = issuesMap[issueId];
  const { isMobile } = usePlatformOS();
  if (!issue) return null;

  const canEditIssueProperties = canEditProperties(issue.project_id);
  const projectIdentifier = getProjectIdentifierById(issue.project_id);

  return (
    <div
      className={cn(
        "min-h-12 relative flex flex-col md:flex-row md:items-center gap-3 bg-custom-background-100 p-3 text-sm",
        {
          "border border-custom-primary-70 hover:border-custom-primary-70": peekIssue && peekIssue.issueId === issue.id,
          "last:border-b-transparent": peekIssue?.issueId !== issue.id,
        }
      )}
    >
      <div className="flex">
        <div className="flex flex-grow items-center gap-3">
          {displayProperties && displayProperties?.key && (
            <div className="flex-shrink-0 text-xs font-medium text-custom-text-300">
              {projectIdentifier}-{issue.sequence_id}
            </div>
          )}

          {issue?.tempId !== undefined && (
            <div className="absolute left-0 top-0 z-[99999] h-full w-full animate-pulse bg-custom-background-100/20" />
          )}

          {issue?.is_draft ? (
            <Tooltip tooltipContent={issue.name} isMobile={isMobile}>
              <span>{issue.name}</span>
            </Tooltip>
          ) : (
            <ControlLink
              href={`/${workspaceSlug}/projects/${issue.project_id}/${issue.archived_at ? "archives/" : ""}issues/${
                issue.id
              }`}
              target="_blank"
              onClick={() => handleIssuePeekOverview(issue)}
              className="w-full line-clamp-1 cursor-pointer text-sm text-custom-text-100"
              disabled={!!issue?.tempId}
            >
              <Tooltip tooltipContent={issue.name} isMobile={isMobile}>
                <span>{issue.name}</span>
              </Tooltip>
            </ControlLink>
          )}
        </div>
        {!issue?.tempId && (
          <div className="block md:hidden border border-custom-border-300 rounded ">{quickActions(issue)}</div>
        )}
      </div>
      <div className="ml-0 md:ml-auto flex flex-wrap  md:flex-shrink-0 items-center gap-2">
        {!issue?.tempId ? (
          <>
            <IssueProperties
              className="relative flex flex-wrap md:flex-grow md:flex-shrink-0 items-center gap-2 whitespace-nowrap"
              issue={issue}
              isReadOnly={!canEditIssueProperties}
              updateIssue={updateIssue}
              displayProperties={displayProperties}
              activeLayout="List"
            />
            <div className="hidden md:block">{quickActions(issue)}</div>
          </>
        ) : (
          <div className="h-4 w-4">
            <Spinner className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
});
