import { ISlackChannel, ISlackUser, SlackService, TSlackPayload } from "@plane/etl/slack";
import { PlaneActivity, Client as PlaneClient } from "@plane/sdk";
import { TWorkspaceConnection, TWorkspaceCredential } from "@plane/types";
import { ENTITIES } from "../helpers/constants";

export interface ParsedIssueData {
  project: string;
  title: string;
  description?: string | null;
  state?: string;
  priority?: string;
  labels?: string[];
  enableThreadSync?: boolean;
}

export interface ParsedLinkWorkItemData {
  projectId: string;
  issueId: string;
  workspaceSlug: string;
}

export interface MetadataPayloadShort {
  type: string;
  channel: ISlackChannel;
  message?: {
    thread_ts: string;
  };
  user: ISlackUser;
  response_url?: string;
  actions: any;
  message_ts: string;
  value: string;
}

export type ShortcutActionPayload = {
  type: string;
  message: {
    text?: string;
    thread_ts?: string;
    ts?: string;
    blocks?: any[];
  };
  channel: {
    id: string;
  };
  response_url?: string;
};
// Define the payload mapping first
type EntityPayloadMapping = {
  [ENTITIES.ISSUE_SUBMISSION]: TSlackPayload;
  [ENTITIES.ISSUE_WEBLINK_SUBMISSION]: MetadataPayloadShort;
  [ENTITIES.ISSUE_COMMENT_SUBMISSION]: MetadataPayloadShort;
  [ENTITIES.SHORTCUT_PROJECT_SELECTION]: ShortcutActionPayload;
  [ENTITIES.COMMAND_PROJECT_SELECTION]: Omit<ShortcutActionPayload, "message">;
  [ENTITIES.LINK_WORK_ITEM]: ShortcutActionPayload;
  [ENTITIES.DISCONNECT_WORK_ITEM]: ShortcutActionPayload;
  // Add more mappings as needed
};

export type TSlackWorkspaceConnectionConfig = {
  userMap?: {
    planeUserId: string;
    slackUser: string;
  }[];
};

export type TSlackConnectionDetails = {
  workspaceConnection: TWorkspaceConnection;
  credentials: TWorkspaceCredential;
  botCredentials: TWorkspaceCredential;
  slackService: SlackService;
  planeClient: PlaneClient;
  missingUserCredentials?: boolean;
};
// Create the indexed type
export type SlackPrivateMetadata<T extends keyof EntityPayloadMapping = keyof EntityPayloadMapping> = {
  entityType: T;
  entityPayload: EntityPayloadMapping[T];
};

// export type SlackPrivateMetadata<T extends string> =
//   | {
//     entityType: typeof ENTITIES.ISSUE_SUBMISSION;
//     entityPayload: TSlackPayload;
//   }
//   | {
//     entityType: typeof ENTITIES.ISSUE_WEBLINK_SUBMISSION | typeof ENTITIES.ISSUE_COMMENT_SUBMISSION;
//     entityPayload: MetadataPayloadShort;
//   }
//   | {
//     entityType: typeof ENTITIES.SHORTCUT_PROJECT_SELECTION | typeof ENTITIES.LINK_WORK_ITEM | typeof ENTITIES.DISCONNECT_WORK_ITEM;
//     entityPayload: ShortcutActionPayload;
//   }

export enum E_MESSAGE_ACTION_TYPES {
  LINK_WORK_ITEM = "link_work_item",
  CREATE_NEW_WORK_ITEM = "issue_shortcut",
  DISCONNECT_WORK_ITEM = "disconnect_work_item",
  ISSUE_WEBLINK_SUBMISSION = "issue_weblink_submission",
  ISSUE_COMMENT_SUBMISSION = "issue_comment_submission",
  CONNECT_ACCOUNT = "connect_account",
}

export type PlaneActivityWithTimestamp = {
  timestamp: string;
} & PlaneActivity;

export type ActivityForSlack = {
  field: string;
  actor: string;
} & (
  | {
      isArrayField: true;
      removed: string[];
      added: string[];
    }
  | {
      isArrayField: false;
      newValue: string;
    }
);
