import { useState } from "react";
import type { IChangeActivity } from "@/services/change-management.service";
import { Button } from "@plane/ui";
import { format } from "date-fns";

type Props = {
  activities: IChangeActivity[];
  onAddComment: (comment: string) => void;
  isAddingComment: boolean;
};

export const ActivityFeed = ({ activities, onAddComment, isAddingComment }: Props) => {
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onAddComment(comment);
      setComment("");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Add Comment Form */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-secondary">Add a note or comment</label>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-md border border-subtle px-3 py-2 text-sm bg-surface-1 outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-placeholder"
            rows={3}
            placeholder="Type your comment here..."
          />
          <div className="flex justify-end">
            <Button variant="primary" type="submit" loading={isAddingComment} disabled={!comment.trim()}>
              Add Note
            </Button>
          </div>
        </form>
      </div>

      <hr className="border-subtle" />

      {/* Activity Feed List */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-secondary">Activity History</h3>
        
        {activities.length === 0 ? (
          <p className="text-sm text-tertiary py-4 text-center">No activity recorded yet.</p>
        ) : (
          <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-subtle">
            {activities.map((activity) => (
              <div key={activity.id} className="relative flex items-start gap-4">
                <div className="absolute -left-[9px] top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-surface-1" />
                <div className="flex flex-col flex-1 gap-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-semibold text-sm text-primary">
                      {activity.actor_display || "System"}
                    </span>
                    <span className="text-sm text-secondary">
                      {formatActivityVerb(activity)}
                    </span>
                    <span className="text-xs text-tertiary ml-auto">
                      {format(new Date(activity.created_at), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                  {activity.comment && (
                    <div className="mt-2 p-3 rounded-md bg-layer-1 border border-subtle text-sm text-primary whitespace-pre-wrap">
                      {activity.comment}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function formatActivityVerb(activity: IChangeActivity): React.ReactNode {
  switch (activity.verb) {
    case "state_changed":
      return (
        <>
          changed state from <span className="font-medium text-primary bg-layer-1 px-1.5 py-0.5 rounded text-xs">{activity.old_value || "none"}</span> to <span className="font-medium text-primary bg-layer-1 px-1.5 py-0.5 rounded text-xs">{activity.new_value}</span>
        </>
      );
    case "approved":
      return `approved the ${activity.field ? activity.field.replace("_", " ") : "approval"}`;
    case "rejected":
      return `rejected the ${activity.field ? activity.field.replace("_", " ") : "approval"}`;
    case "field_updated":
      return (
        <>
          updated <span className="font-medium text-primary">{activity.field?.replace(/_/g, " ")}</span> from <span className="font-medium text-primary bg-layer-1 px-1.5 py-0.5 rounded text-xs">{activity.old_value || "none"}</span> to <span className="font-medium text-primary bg-layer-1 px-1.5 py-0.5 rounded text-xs">{activity.new_value}</span>
        </>
      );
    case "commented":
      return "added a comment";
    case "task_completed":
      return (
        <>
          marked task <span className="font-medium text-primary">'{activity.field?.replace(/_/g, " ")}'</span> as <span className="font-medium text-primary bg-layer-1 px-1.5 py-0.5 rounded text-xs">{activity.new_value}</span>
        </>
      );
    default:
      return "performed an action";
  }
}
