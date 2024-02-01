import { useState, useRef } from "react";
import { observer } from "mobx-react-lite";
import { Draggable } from "@hello-pangea/dnd";
import { MoreHorizontal } from "lucide-react";
// components
import { Tooltip, ControlLink } from "@plane/ui";
// hooks
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// helpers
import { cn } from "helpers/common.helper";
// types
import { TIssue, TIssueMap } from "@plane/types";
import { useApplication, useIssueDetail, useProject, useProjectState } from "hooks/store";

type Props = {
  issues: TIssueMap | undefined;
  issueIdList: string[] | null;
  quickActions: (issue: TIssue, customActionButton?: React.ReactElement) => React.ReactNode;
  showAllIssues?: boolean;
};

export const CalendarIssueBlocks: React.FC<Props> = observer((props) => {
  const { issues, issueIdList, quickActions, showAllIssues = false } = props;
  // hooks
  const {
    router: { workspaceSlug, projectId },
  } = useApplication();
  const { getProjectById } = useProject();
  const { getProjectStates } = useProjectState();
  const { peekIssue, setPeekIssue } = useIssueDetail();
  // states
  const [isMenuActive, setIsMenuActive] = useState(false);

  const menuActionRef = useRef<HTMLDivElement | null>(null);

  const handleIssuePeekOverview = (issue: TIssue) =>
    workspaceSlug &&
    issue &&
    issue.project_id &&
    issue.id &&
    setPeekIssue({ workspaceSlug, projectId: issue.project_id, issueId: issue.id });

  useOutsideClickDetector(menuActionRef, () => setIsMenuActive(false));

  const customActionButton = (
    <div
      ref={menuActionRef}
      className={`w-full cursor-pointer rounded p-1 text-custom-sidebar-text-400 hover:bg-custom-background-80 ${
        isMenuActive ? "bg-custom-background-80 text-custom-text-100" : "text-custom-text-200"
      }`}
      onClick={() => setIsMenuActive(!isMenuActive)}
    >
      <MoreHorizontal className="h-3.5 w-3.5" />
    </div>
  );

  return (
    <>
      {issueIdList?.slice(0, showAllIssues ? issueIdList.length : 4).map((issueId, index) => {
        if (!issues?.[issueId]) return null;

        const issue = issues?.[issueId];

        const stateColor =
          getProjectStates(issue?.project_id)?.find((state) => state?.id == issue?.state_id)?.color || "";

        return (
          <Draggable key={issue.id} draggableId={issue.id} index={index}>
            {(provided, snapshot) => (
              <div
                className="relative cursor-pointer p-1 px-2"
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                ref={provided.innerRef}
              >
                <ControlLink
                  href={`/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`}
                  target="_blank"
                  onClick={() => handleIssuePeekOverview(issue)}
                  className="w-full line-clamp-1 cursor-pointer text-sm text-custom-text-100"
                >
                  <>
                    {issue?.tempId !== undefined && (
                      <div className="absolute left-0 top-0 z-[99999] h-full w-full animate-pulse bg-custom-background-100/20" />
                    )}

                    <div
                      className={cn(
                        "group/calendar-block flex h-8 w-full items-center justify-between gap-1.5 rounded border-[0.5px] border-custom-border-200 hover:border-custom-border-400 px-1 py-1.5 ",
                        {
                          "bg-custom-background-90 shadow-custom-shadow-rg border-custom-primary-100":
                            snapshot.isDragging,
                        },
                        { "bg-custom-background-100 hover:bg-custom-background-90": !snapshot.isDragging },
                        {
                          "border border-custom-primary-70 hover:border-custom-primary-70":
                            peekIssue?.issueId === issue.id,
                        }
                      )}
                    >
                      <div className="flex h-full items-center gap-1.5">
                        <span
                          className="h-full w-0.5 flex-shrink-0 rounded"
                          style={{
                            backgroundColor: stateColor,
                          }}
                        />
                        <div className="flex-shrink-0 text-xs text-custom-text-300">
                          {getProjectById(issue?.project_id)?.identifier}-{issue.sequence_id}
                        </div>
                        <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
                          <div className="truncate text-xs">{issue.name}</div>
                        </Tooltip>
                      </div>
                      <div
                        className={`hidden h-5 w-5 group-hover/calendar-block:block ${isMenuActive ? "!block" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        {quickActions(issue, customActionButton)}
                      </div>
                    </div>
                  </>
                </ControlLink>
              </div>
            )}
          </Draggable>
        );
      })}
    </>
  );
});
