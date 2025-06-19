/* ----------- Importer Utility ----------- */

import { TExtractedCycle, TExtractedIssue, TExtractedIssueType, TExtractedLabel, TExtractedModule, TExtractedUser } from "./extract";

// Configuration model for flatfile
export type FlatfileConfig = {
  appId: string;
  jobId: string;
  actorId: string;
  spaceId: string;
  accountId: string;
  workbookId: string;
  environmentId: string;
}

export type FlatfileServiceConfig = {
  apiKey: string;
}

export type TFlatfileEntity = {
  users: TExtractedUser[]
  labels: TExtractedLabel[]
  cycles: TExtractedCycle[]
  modules: TExtractedModule[]
  issues: TExtractedIssue[]
  issue_types: TExtractedIssueType[]
}
