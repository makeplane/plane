import { ExIssueLabel, PlaneUser, ExIssue } from "@plane/sdk"
import { Client as PlaneClient } from "@plane/sdk"

export type IssuePayload = {
  jobId: string
  meta: any
  planeLabels: ExIssueLabel[]
  issueProcessIndex: number
  planeClient: PlaneClient
  workspaceSlug: string
  projectId: string
  users: PlaneUser[]
  sourceAccessToken: string
}

export type IssueCreatePayload = IssuePayload & {
  issues: ExIssue[]
}

export type IssueWithParentPayload = IssuePayload & {
  issuesWithParent: ExIssue[]
  createdOrphanIssues: ExIssue[]
}
