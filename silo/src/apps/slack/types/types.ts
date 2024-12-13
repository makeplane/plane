import { TSlackPayload } from "@silo/slack";
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

export type SlackPrivateMetadata =
  | {
      entityType: typeof ENTITIES.ISSUE_SUBMISSION;
      entityPayload: TSlackPayload;
    }
  | {
      entityType: typeof ENTITIES.ISSUE_COMMENT_SUBMISSION;
      entityPayload: any;
    };
