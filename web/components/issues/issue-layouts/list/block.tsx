import { Dispatch, MouseEvent, SetStateAction, useRef } from "react";
import { observer } from "mobx-react-lite";
import { ChevronRight } from "lucide-react";
// types
import { TIssue, IIssueDisplayProperties, TIssueMap } from "@plane/types";
// ui
import { Spinner, Tooltip, ControlLink } from "@plane/ui";
// components
import { IssueProperties } from "@/components/issues/issue-layouts/properties";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppRouter, useIssueDetail, useProject } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// types
import { TRenderQuickActions } from "./list-view-types";

interface IssueBlockProps {
  issueId: string;
  issuesMap: TIssueMap;
  updateIssue: ((projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  displayProperties: IIssueDisplayProperties | undefined;
  canEditProperties: (projectId: string | undefined) => boolean;
  nestingLevel: number;
  spacingLeft?: number;
  isExpanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
}

export const IssueBlock: React.FC<IssueBlockProps> = observer((props: IssueBlockProps) => {
  const {
    issuesMap,
    issueId,
    updateIssue,
    quickActions,
    displayProperties,
    canEditProperties,
    nestingLevel,
    spacingLeft = 14,
    isExpanded,
    setExpanded,
  } = props;
  // refs
  const parentRef = useRef(null);
  // hooks
  const { workspaceSlug } = useAppRouter();
  const { getProjectIdentifierById } = useProject();
  const { getIsIssuePeeked, setPeekIssue, subIssues: subIssuesStore } = useIssueDetail();

  const handleIssuePeekOverview = (issue: TIssue) =>
    workspaceSlug &&
    issue &&
    issue.project_id &&
    issue.id &&
    !getIsIssuePeeked(issue.id) &&
    setPeekIssue({ workspaceSlug, projectId: issue.project_id, issueId: issue.id });

  const issue = issuesMap[issueId];
  const subIssues = subIssuesStore.subIssuesByIssueId(issueId);
  const { isMobile } = usePlatformOS();
  if (!issue) return null;

  const canEditIssueProperties = canEditProperties(issue.project_id);
  const projectIdentifier = getProjectIdentifierById(issue.project_id);
  // if sub issues have been fetched for the issue, use that for count or use issue's sub_issues_count
  const subIssuesCount = subIssues ? subIssues.length : issue.sub_issues_count;

  const paddingLeft = `${spacingLeft}px`;

  const handleToggleExpand = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (nestingLevel >= 3) {
      handleIssuePeekOverview(issue);
    } else {
      setExpanded((prevState) => {
        if (!prevState && workspaceSlug && issue)
          subIssuesStore.fetchSubIssues(workspaceSlug.toString(), issue.project_id, issue.id);
        return !prevState;
      });
    }
  };

  return (
    <div
      ref={parentRef}
      className={cn(
        "min-h-[52px] relative flex flex-col md:flex-row md:items-center gap-3 bg-custom-background-100 p-3 pl-8 text-sm",
        {
          "border border-custom-primary-70 hover:border-custom-primary-70": getIsIssuePeeked(issue.id),
          "last:border-b-transparent": !getIsIssuePeeked(issue.id),
        }
      )}
    >
      <div className="flex w-full truncate" style={nestingLevel !== 0 ? { paddingLeft } : {}}>
        <div className="flex flex-grow items-center gap-3 truncate">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center">
              {subIssuesCount > 0 && (
                <button
                  className="flex items-center justify-center h-5 w-5 cursor-pointer rounded-sm text-custom-text-400  hover:text-custom-text-300"
                  onClick={handleToggleExpand}
                >
                  <ChevronRight className={`h-4 w-4 ${isExpanded ? "rotate-90" : ""}`} />
                </button>
              )}
            </div>
            {displayProperties && displayProperties?.key && (
              <div className="flex-shrink-0 text-xs font-medium text-custom-text-300">
                {projectIdentifier}-{issue.sequence_id}
              </div>
            )}

            {issue?.tempId !== undefined && (
              <div className="absolute left-0 top-0 z-[99999] h-full w-full animate-pulse bg-custom-background-100/20" />
            )}
          </div>

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
              className="relative flex flex-wrap items-center gap-2 whitespace-nowrap md:flex-shrink-0 md:flex-grow"
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
