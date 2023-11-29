import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Draggable } from "@hello-pangea/dnd";
// components
import { Tooltip } from "@plane/ui";
// types
import { IIssue } from "types";
import { IIssueResponse } from "store/issues/types";

type Props = {
  issues: IIssueResponse | undefined;
  issueIdList: string[] | null;
  quickActions: (issue: IIssue) => React.ReactNode;
};

export const CalendarIssueBlocks: React.FC<Props> = observer((props) => {
  const { issues, issueIdList, quickActions } = props;
  // router
  const router = useRouter();

  const handleIssuePeekOverview = (issue: IIssue) => {
    const { query } = router;

    router.push({
      pathname: router.pathname,
      query: { ...query, peekIssueId: issue?.id, peekProjectId: issue?.project },
    });
  };

  return (
    <>
      {issueIdList?.map((issueId, index) => {
        if (!issues?.[issueId]) return null;

        const issue = issues?.[issueId];
        return (
          <Draggable key={issue.id} draggableId={issue.id} index={index}>
            {(provided, snapshot) => (
              <div
                className="p-1 px-2 relative cursor-pointer"
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                ref={provided.innerRef}
                onClick={() => handleIssuePeekOverview(issue)}
              >
                {issue?.tempId !== undefined && (
                  <div className="absolute top-0 left-0 w-full h-full animate-pulse bg-custom-background-100/20 z-[99999]" />
                )}

                <div
                  className={`group/calendar-block h-8 w-full shadow-custom-shadow-2xs rounded py-1.5 px-1 flex items-center justify-between gap-1.5 border-[0.5px] border-custom-border-100 ${
                    snapshot.isDragging
                      ? "shadow-custom-shadow-rg bg-custom-background-90"
                      : "bg-custom-background-100 hover:bg-custom-background-90"
                  }`}
                >
                  <div className="flex items-center gap-1.5 h-full">
                    <span
                      className="h-full w-0.5 rounded flex-shrink-0"
                      style={{
                        backgroundColor: issue.state_detail.color,
                      }}
                    />
                    <div className="text-xs text-custom-text-300 flex-shrink-0">
                      {issue.project_detail.identifier}-{issue.sequence_id}
                    </div>
                    <Tooltip tooltipHeading="Title" tooltipContent={issue.name}>
                      <div className="text-xs truncate">{issue.name}</div>
                    </Tooltip>
                  </div>
                  <div
                    className="hidden group-hover/calendar-block:block"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {quickActions(issue)}
                  </div>
                </div>
              </div>
            )}
          </Draggable>
        );
      })}
    </>
  );
});
