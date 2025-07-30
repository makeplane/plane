import { FC } from "react";
import { TNotification } from "@plane/types";
import {
  convertMinutesToHoursMinutesString,
  renderFormattedDate,
  sanitizeCommentForNotification,
  replaceUnderscoreIfSnakeCase,
  stripAndTruncateHTML,
} from "@plane/utils";
// components
import { LiteTextEditor } from "@/components/editor/lite-text";

export const NotificationContent: FC<{
  notification: TNotification;
  workspaceId: string;
  workspaceSlug: string;
  projectId: string;
  renderCommentBox?: boolean;
}> = ({ notification, workspaceId, workspaceSlug, projectId, renderCommentBox = false }) => {
  const { data, triggered_by_details: triggeredBy } = notification;
  const notificationField = data?.issue_activity.field;
  const newValue = data?.issue_activity.new_value;
  const oldValue = data?.issue_activity.old_value;
  const verb = data?.issue_activity.verb;

  const renderTriggerName = () => (
    <span className="text-custom-text-100 font-medium">
      {triggeredBy?.is_bot ? triggeredBy.first_name : triggeredBy?.display_name}{" "}
    </span>
  );

  const renderAction = () => {
    if (!notificationField) return "";
    if (notificationField === "duplicate")
      return verb === "created"
        ? "marked that this work item is a duplicate of"
        : "marked that this work item is not a duplicate";
    if (notificationField === "assignees") {
      return newValue !== "" ? "added assignee" : "removed assignee";
    }
    if (notificationField === "start_date") {
      return newValue !== "" ? "set start date" : "removed the start date";
    }
    if (notificationField === "target_date") {
      return newValue !== "" ? "set due date" : "removed the due date";
    }
    if (notificationField === "labels") {
      return newValue !== "" ? "added label" : "removed label";
    }
    if (notificationField === "parent") {
      return newValue !== "" ? "added parent" : "removed parent";
    }
    if (notificationField === "relates_to") return "marked that this work item is related to";
    if (notificationField === "comment") return "commented";
    if (notificationField === "archived_at") {
      return newValue === "restore" ? "restored the work item" : "archived the work item";
    }
    if (notificationField === "None") return null;

    const baseAction = !["comment", "archived_at"].includes(notificationField) ? verb : "";
    return `${baseAction} ${replaceUnderscoreIfSnakeCase(notificationField)}`;
  };

  const renderValue = () => {
    if (notificationField === "None") return "the work item and assigned it to you.";
    if (notificationField === "comment") return renderCommentBox ? null : sanitizeCommentForNotification(newValue);
    if (notificationField === "target_date" || notificationField === "start_date") return renderFormattedDate(newValue);
    if (notificationField === "attachment") return "the work item";
    if (notificationField === "description") return stripAndTruncateHTML(newValue || "", 55);
    if (notificationField === "archived_at") return null;
    if (notificationField === "assignees") return newValue !== "" ? newValue : oldValue;
    if (notificationField === "labels") return newValue !== "" ? newValue : oldValue;
    if (notificationField === "parent") return newValue !== "" ? newValue : oldValue;
    if (notificationField === "estimate_time")
      return newValue !== ""
        ? convertMinutesToHoursMinutesString(Number(newValue))
        : convertMinutesToHoursMinutesString(Number(oldValue));
    return newValue;
  };

  const shouldShowConnector = ![
    "comment",
    "archived_at",
    "None",
    "assignees",
    "labels",
    "start_date",
    "target_date",
    "parent",
  ].includes(notificationField || "");

  return (
    <>
      {renderTriggerName()}
      <span className="text-custom-text-300">{renderAction()} </span>
      {verb !== "deleted" && (
        <>
          {shouldShowConnector && <span className="text-custom-text-300">to </span>}
          <span className="text-custom-text-100 font-medium">{renderValue()}</span>
          {notificationField === "comment" && renderCommentBox && (
            <div className="scale-75 origin-left">
              <LiteTextEditor
                editable={false}
                id=""
                initialValue={newValue ?? ""}
                workspaceId={workspaceId}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                displayConfig={{
                  fontSize: "small-font",
                }}
              />
            </div>
          )}
          {"."}
        </>
      )}
    </>
  );
};
