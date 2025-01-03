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

export type SlackPrivateMetadata =
  | {
      entityType: typeof ENTITIES.SHORTCUT_PROJECT_SELECTION;
      entityPayload: TMessageActionPayload;
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
