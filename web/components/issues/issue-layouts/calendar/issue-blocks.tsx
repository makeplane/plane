import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Draggable } from "@hello-pangea/dnd";
// types
import { IIssue } from "types";

type Props = {
  issues: IIssue[] | null;
  quickActions: (issue: IIssue) => React.ReactNode;
};

export const CalendarIssueBlocks: React.FC<Props> = observer((props) => {
  const { issues, quickActions } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <div className="space-y-2 h-full w-full overflow-y-auto p-0.5">
      {issues?.map((issue, index) => (
        <Draggable key={issue.id} draggableId={issue.id} index={index}>
          {(provided, snapshot) => (
            <Link href={`/${workspaceSlug?.toString()}/projects/${issue.project}/issues/${issue.id}`}>
              <a
                className={`group/calendar-block h-8 w-full shadow-custom-shadow-2xs rounded py-1.5 px-1 flex items-center gap-1.5 border-[0.5px] border-custom-border-100 ${
                  snapshot.isDragging
                    ? "shadow-custom-shadow-rg bg-custom-background-90"
                    : "bg-custom-background-100 hover:bg-custom-background-90"
                }`}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                ref={provided.innerRef}
              >
                <span
                  className="h-full w-0.5 rounded flex-shrink-0"
                  style={{
                    backgroundColor: issue.state_detail.color,
                  }}
                />
                <div className="text-xs text-custom-text-300 flex-shrink-0">
                  {issue.project_detail.identifier}-{issue.sequence_id}
                </div>
                <h6 className="text-xs flex-grow truncate">{issue.name}</h6>
                <div className="hidden group-hover/calendar-block:block">{quickActions(issue)}</div>
                {/* <IssueQuickActions
                    issue={issue}
                    handleDelete={async () => handleIssues(issue.target_date ?? "", issue, "delete")}
                    handleUpdate={async (data) => handleIssues(issue.target_date ?? "", data, "update")}
                  /> */}
              </a>
            </Link>
          )}
        </Draggable>
      ))}
    </div>
  );
});
