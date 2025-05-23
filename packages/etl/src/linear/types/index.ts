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
  Organization,
  Project,
  Document,
} from "@linear/sdk";
import { Client, ExProject, ExState } from "@plane/sdk";
import { LinearService } from "../services";

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

export enum E_LinearDocsMigratorStep {
  PULL = "pull",
  TRANSFORM = "transform",
  PUSH = "push",
}

export type LinearAuthProps = {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
};

export type LinearPATAuthState = {
  workspaceId: string;
  workspaceSlug: string;
  apiToken: string;
  userId: string;
  personalAccessToken: string;
};

export interface LinearConfig {
  // linear properties
  teamId: string;
  teamUrl: string;
  teamName: string;
  workspace: string;
  workspaceDetail: Organization;
  teamDetail: Team;
  // plane properties
  planeProject: ExProject;
  state: IStateConfig[];
  skipUserImport: boolean;
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
  projects: LinearProject[];
  labels: IssueLabel[];
}

export interface LinearDocumentEntity {
  documents: Document[];
}

export interface LinearDocumentEntity {
  documents: Document[];
}

export type LinearDocument = Document;

export type LinearCycle = {
  cycle: Cycle;
  issues: Issue[];
};

export type LinearProject = {
  project: Project;
  issues: Issue[];
};

export type LinearContentParserConfig = {
  planeClient: Client;
  linearService: LinearService;
  workspaceSlug: string;
  projectId: string;
  fileDownloadHeaders: Record<string, string>;
  apiBaseUrl: string;
  appBaseUrl?: string;
  userMap: Map<string, string>;
};

export type LinearComment = Comment & { issue_id: string; user_id: string };
export type LinearIssueAttachment = Attachment & { issue_id: string };

export type { Team as LinearTeam, WorkflowState as LinearState, Organization as LinearOrganization };

// Define the Linear migrator class
export type TLinearIssueWithChildren = Issue & {
  children?: TLinearIssueWithChildren[];
};

export enum E_LINEAR_IMPORT_PHASE {
  ISSUES = "issues",
  PAGES = "pages",
}
