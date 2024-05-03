import { useRef } from "react";
import { observer } from "mobx-react-lite";
import { TIssue, IIssueDisplayProperties, TIssueMap } from "@plane/types";
// ui
import { Spinner, Tooltip, ControlLink } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useApplication, useIssueDetail, useProject } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// types
import { IssueProperties } from "../properties/all-properties";
import { TRenderQuickActions } from "./list-view-types";

interface IssueBlockProps {
  issueId: string;
  issuesMap: TIssueMap;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  displayProperties: IIssueDisplayProperties | undefined;
  canEditProperties: (projectId: string | undefined) => boolean;
}

export const IssueBlock: React.FC<IssueBlockProps> = observer((props: IssueBlockProps) => {
  const { issuesMap, issueId, updateIssue, quickActions, displayProperties, canEditProperties } = props;
  // refs
  const parentRef = useRef(null);
  // hooks
  const {
    router: { workspaceSlug },
  } = useApplication();
  const { getProjectIdentifierById } = useProject();
  const { getIsIssuePeeked, setPeekIssue } = useIssueDetail();

  const handleIssuePeekOverview = (issue: TIssue) =>
    workspaceSlug &&
    issue &&
    issue.project_id &&
    issue.id &&
    !getIsIssuePeeked(issue.id) &&
    setPeekIssue({ workspaceSlug, projectId: issue.project_id, issueId: issue.id });

  const issue = issuesMap[issueId];
  const { isMobile } = usePlatformOS();
  if (!issue) return null;

  const canEditIssueProperties = canEditProperties(issue.project_id);
  const projectIdentifier = getProjectIdentifierById(issue.project_id);

  return (
    <div
      ref={parentRef}
      className={cn(
        "min-h-[52px] relative flex flex-col md:flex-row md:items-center gap-3 bg-custom-background-100 p-3 text-sm",
        {
          "border border-custom-primary-70 hover:border-custom-primary-70": getIsIssuePeeked(issue.id),
          "last:border-b-transparent": !getIsIssuePeeked(issue.id),
        }
      )}
    >
      <div className="flex w-full truncate">
        <div className="flex flex-grow items-center gap-3 truncate">
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
              <p className="truncate">{issue.name}</p>
            </Tooltip>
          ) : (
            <ControlLink
              id={`issue-${issue.id}`}
              href={`/${workspaceSlug}/projects/${issue.project_id}/${issue.archived_at ? "archives/" : ""}issues/${
                issue.id
              }`}
              target="_blank"
              onClick={() => handleIssuePeekOverview(issue)}
              className="w-full truncate cursor-pointer text-sm text-custom-text-100"
              disabled={!!issue?.tempId}
            >
              <Tooltip tooltipContent={issue.name} isMobile={isMobile}>
                <p className="truncate">{issue.name}</p>
              </Tooltip>
            </ControlLink>
          )}
        </div>
        {!issue?.tempId && (
          <div className="block md:hidden border border-custom-border-300 rounded ">
            {quickActions({
              issue,
              parentRef,
            })}
          </div>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
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
            <div className="hidden md:block">
              {quickActions({
                issue,
                parentRef,
              })}
            </div>
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
