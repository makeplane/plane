import { TIssuePropertyValuesPayload } from "@plane/etl/core";
import {
  ExIssueLabel,
  PlaneUser,
  ExIssue,
  ExIssueType,
  ExIssuePropertyOption,
  ExIssueProperty,
  Client as PlaneClient,
} from "@plane/sdk";
import { TWorkspaceCredential } from "@plane/types";

export type IssuePayload = {
  jobId: string;
  meta: any;
  planeLabels: ExIssueLabel[];
  issueProcessIndex: number;
  planeClient: PlaneClient;
  workspaceSlug: string;
  projectId: string;
  users: PlaneUser[];
  credentials: TWorkspaceCredential;
  planeIssueTypes: ExIssueType[];
  planeIssueProperties: ExIssueProperty[];
  planeIssuePropertiesOptions: ExIssuePropertyOption[];
  planeIssuePropertyValues: TIssuePropertyValuesPayload;
};

export type IssueCreatePayload = IssuePayload & {
  issues: ExIssue[];
};

export type IssueWithParentPayload = IssuePayload & {
  issuesWithParent: ExIssue[];
  createdOrphanIssues: ExIssue[];
};
