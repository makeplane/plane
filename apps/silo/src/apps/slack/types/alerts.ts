import { ExIssue, ExIssueComment } from "@plane/sdk";

export enum ESlackDMAlertActivityType {
  ASSIGNEE = "assignee",
  COMMENT_MENTION = "comment_mention",
  WORK_ITEM_DESCRIPTION_MENTION = "work_item_description_mention",
}

export enum ESlackDMAlertActivityAction {
  ADDED = "added",
  REMOVED = "removed",
}

export type TSlackDMAlertActivity = {
  actor_id: string;
  type: ESlackDMAlertActivityType;
  action: ESlackDMAlertActivityAction;
};

export enum ESlackDMAlertType {
  ISSUE = "issue",
  COMMENT = "comment",
}

export type TSlackDMAlert = {
  // The type of activity that is being alerted for
  activities: TSlackDMAlertActivity[];
  workspace_id: string;

  // Base details supporting both issue and comment
  project_id: string;
  issue_id: string;
  comment_id?: string;
} & (
  | {
      type: ESlackDMAlertType.ISSUE;
      payload: ExIssue;
    }
  | {
      type: ESlackDMAlertType.COMMENT;
      payload: ExIssueComment;
    }
);

export type TSlackDMAlertBlockPayload = {
  text: string;
  blocks: any[];
  unfurlLinks: boolean;
};

export type TSlackDMBlockFormationCtx = {
  workspaceSlug: string;
  workItemDisplayInfo: TSlackDMWorkItemDisplayInfo;
  parsedMarkdownFromAlert: string;
  planeToSlackMap: Map<string, string>;
  actorDisplayName: string;
};

export type TSlackDMWorkItemDisplayInfo = {
  url: string;
  displayText: string;
  title: string;
  identifier: string;
};

export type TSlackDMAlertKeyProps = {
  workspace_id: string;
  project_id: string;
  issue_id: string;
  issue_comment_id?: string;
};
