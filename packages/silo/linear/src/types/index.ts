import {
  Attachment,
  Comment,
  Cycle,
  Issue,
  IssueLabel,
  IssuePriorityValue,
  User,
  Team,
  WorkflowState,
} from "@linear/sdk";
import { ExState } from "@plane/sdk";

export type LinearAuthState = {
  workspaceId: string;
  workspaceSlug: string;
  apiToken: string;
  userId: string;
};

export type LinearAuthPayload = {
  state: string;
  code: string;
};

export type LinearAuthProps = {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
};

export interface LinearConfig {
  teamId: string;
  teamUrl: string;
  state: IStateConfig[];
}

export interface IStateConfig {
  source_state: {
    id: string;
    name: string;
  };
  target_state: ExState;
}

export interface IPriorityConfig {
  source_priority: IssuePriorityValue;
  target_priority: string;
}

export interface LinearEntity {
  issues: Issue[];
  issue_comments: LinearComment[];
  users: User[];
  cycles: LinearCycle[];
  labels: IssueLabel[];
}

export type LinearCycle = {
  cycle: Cycle;
  issues: Issue[];
};

export type LinearComment = Comment & { issue_id: string; user_id: string };
export type LinearIssueAttachment = Attachment & { issue_id: string };

export type { Team as LinearTeam, WorkflowState as LinearState };
