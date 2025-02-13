import {
  ISlackChannel,
  ISlackMessage,
  ISlackUser,
  TMessageActionPayload,
  TSlackCommandPayload,
  TSlackPayload,
} from "@plane/etl/slack";
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
  };
  channel: {
    id: string;
  };
  response_url?: string;
};

export type SlackPrivateMetadata =
  | {
      entityType: typeof ENTITIES.SHORTCUT_PROJECT_SELECTION;
      entityPayload: ShortcutActionPayload;
    }
  | {
      entityType: typeof ENTITIES.COMMAND_PROJECT_SELECTION;
      entityPayload: TSlackCommandPayload;
    }
  | {
      entityType: typeof ENTITIES.ISSUE_SUBMISSION;
      entityPayload: TSlackPayload;
    }
  | {
      entityType: typeof ENTITIES.ISSUE_WEBLINK_SUBMISSION | typeof ENTITIES.ISSUE_COMMENT_SUBMISSION;
      entityPayload: MetadataPayloadShort;
    };
