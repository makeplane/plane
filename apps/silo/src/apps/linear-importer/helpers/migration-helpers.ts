import { Issue as LinearIssue } from "@linear/sdk";
import { LinearCycle, LinearService } from "@plane/etl/linear";
import { TWorkspaceCredential } from "@plane/types";
import { env } from "@/env";

export const filterCyclesForIssues = (issues: LinearIssue[], cycles: LinearCycle[]): any[] => {
  const issueIds = new Set(issues.map((issue) => issue.id));

  return cycles
    .filter((cycle) => cycle.issues.some((issue) => issueIds.has(issue.id)))
    .map((cycle) => ({
      ...cycle,
      issues: cycle.issues.filter((issue) => issueIds.has(issue.id)),
    }));
};

export const createLinearClient = (credentials: TWorkspaceCredential): LinearService => {
  if (env.LINEAR_OAUTH_ENABLED === "1") {
    return new LinearService({
      isPAT: false,
      accessToken: credentials.source_access_token!,
    });
  } else {
    return new LinearService({
      isPAT: true,
      apiKey: credentials.source_access_token!,
    });
  }
};
