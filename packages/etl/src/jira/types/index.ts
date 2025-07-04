import { ExProject, ExState } from "@plane/sdk";
import {
  Comment as JComment,
  ComponentWithIssueCount,
  Priority as JiraPriority,
  Project as JiraProject,
  StatusDetails as JiraStatus,
  FieldDetails,
  Issue,
  IssueTypeWithStatus as JiraStates,
  IssueTypeDetails as JiraIssueTypeDetails,
  CustomFieldContextOption,
} from "jira.js/out/version3/models";

export type JiraProps =
  | {
      isPAT: false;
      cloudId: string;
      accessToken: string;
      refreshToken: string;
      refreshTokenFunc: (refreshToken: string) => Promise<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
      }>;
      refreshTokenCallback: (arg0: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      }) => Promise<void>;
    }
  | {
      isPAT: true;
      hostname: string;
      userEmail: string;
      patToken: string;
    };

export type JiraResource = {
  id: string;
  url: string;
  name: string;
  scopes: string[];
  avatarUrl: string;
};

export type ImportedJiraUser = {
  user_id: string;
  user_name: string;
  email: string;
  user_status: string;
  added_to_org: string;
  org_role: string;
};

export type JiraComment = JComment & {
  issue_id: string;
};

export type JiraSprintObject = {
  id: number;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
  createdDate?: string;
};

export interface PaginatedResponse {
  total?: number;
  [key: string]: any; // Allow dynamic properties
}

export type JiraSprint = {
  sprint: JiraSprintObject;
  issues: IJiraIssue[];
};

export type JiraComponent = {
  component: ComponentWithIssueCount;
  issues: IJiraIssue[];
};

export type JiraEntity = {
  labels: string[];
  issues: IJiraIssue[];
  users: ImportedJiraUser[];
  issue_comments: JiraComment[];
  sprints: JiraSprint[];
  components: JiraComponent[];
  issueTypes: JiraIssueTypeDetails[];
  issueFields: JiraIssueField[];
};

export interface IResource {
  id: string;
  url: string;
  name: string;
  scopes: string[];
  avatarUrl: string;
}

// Define the type for IssueType
export interface IIssueTypeConfig {
  name: string;
  value: string;
}

// Define the type for Label
export interface ILabelConfig {
  name: string;
  value: boolean;
}

// Define the type for State
export interface IStateConfig {
  source_state: JiraStatus;
  target_state: ExState;
}

// Define the type for Priority
export interface IPriorityConfig {
  source_priority: JiraPriority;
  target_priority: string;
}

export type JiraConfig = {
  issues: number;
  // Users are string, as not we are saving the csv string into the config
  users: string;
  resource?: IResource;
  project: JiraProject;
  planeProject: ExProject;
  issueType: string;
  label: string[];
  state: IStateConfig[];
  priority: IPriorityConfig[];
  skipUserImport: boolean
};

export type JiraAuthState = {
  apiToken: string;
  workspaceId: string;
  workspaceSlug: string;
  userId: string;
};

export type JiraPATAuthState = {
  workspaceId: string;
  userId: string;
  apiToken: string;
  personalAccessToken: string;
  userEmail: string;
  hostname: string;
};

export type JiraAuthPayload = {
  state: string;
  code: string;
};

export type JiraAuthProps = {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
  authorizeURL: string;
  tokenURL: string;
};

export type JiraIssueField = FieldDetails & {
  options?: JiraIssueFieldOptions[];
};

export type JiraIssueFieldOptions = CustomFieldContextOption & {
  fieldId: string;
};

// Define the Jira migrator class
export type TJiraIssueWithChildren = IJiraIssue & {
  children?: TJiraIssueWithChildren[];
};

export type IJiraIssue = Issue;

export type { JiraProject, JiraStates, JiraStatus, JiraPriority };

export type { JiraCustomFieldKeys } from "./custom-fields";
