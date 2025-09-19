import { E_IMPORTER_KEYS } from "@plane/etl/core";
import {
  transformComment,
  transformCycle,
  transformIssue,
  transformUser,
  LinearConfig,
  LinearEntity,
  LinearDocument,
  transformDocument,
  LinearContentParserConfig,
  LinearService,
} from "@plane/etl/linear";
import {
  Client,
  ExCycle,
  ExIssueComment,
  ExIssueLabel,
  ExModule,
  ExPage,
  ExIssue as PlaneIssue,
  PlaneUser,
} from "@plane/sdk";
import { TImportJob } from "@plane/types";
import { env } from "@/env";
import { getRandomColor } from "@/helpers/generic-helpers";
import { getJobCredentials } from "@/helpers/job";
/* ------------------ Transformers ----------------------
This file contains transformers for Linear entities, responsible
for converting the given Linear entities into Plane entities. The
transformation depends on the types exported by the source core,
and the core types need to be maintained to get the correct
transformation results.
--------------------- Transformers ---------------------- */

export const getTransformedIssues = async (
  job: TImportJob<LinearConfig>,
  entities: LinearEntity
): Promise<Partial<PlaneIssue>[]> => {
  const teamUrl = job.config?.teamUrl || "";
  const stateMap = job.config?.state || [];
  // TODO: fix types
  const issuePromises = entities.issues.map(async (issue: any) => {
    const transformedIssue = await transformIssue(issue, teamUrl, entities.users, entities.labels, stateMap);
    // Add a label signifying the issue is imported from Linear
    if (transformedIssue.labels) {
      transformedIssue.labels.push("Linear Imported");
    } else {
      transformedIssue.labels = ["Linear Imported"];
    }

    return transformedIssue;
  });

  return Promise.all(issuePromises);
};

export const getTransformedLabels = (_job: TImportJob<LinearConfig>, entities: LinearEntity): Partial<ExIssueLabel>[] =>
  // TODO: fix types
  entities.labels.map(
    (label: any): Partial<ExIssueLabel> => ({
      name: label.name,
      color: label.color ?? getRandomColor(),
    })
  );

export const getTransformedComments = (
  _job: TImportJob<LinearConfig>,
  entities: LinearEntity
): Partial<ExIssueComment>[] => {
  const commentPromises = entities.issue_comments.map((comment) => transformComment(comment, entities.users));
  return commentPromises;
};

export const getTransformedUsers = (_job: TImportJob<LinearConfig>, entities: LinearEntity): Partial<PlaneUser>[] =>
  entities.users.map(transformUser);

export const getTransformedCycles = (_job: TImportJob<LinearConfig>, entities: LinearEntity): Partial<ExCycle>[] => {
  const cyclePromises = entities.cycles.map(transformCycle);
  return cyclePromises;
};

export const getTransformedDocuments = async (
  job: TImportJob<LinearConfig>,
  client: LinearService,
  documents: LinearDocument[]
): Promise<Partial<ExPage>[]> => {
  let planeClient: Client | null = null;
  let imageDownloadHeaders: Record<string, string> | undefined = undefined;

  try {
    const credential = await getJobCredentials(job);

    if (credential) {
      planeClient = new Client({
        apiToken: credential.target_access_token as string,
        baseURL: env.API_BASE_URL,
      });
      imageDownloadHeaders = {
        Authorization: `${credential.source_access_token}`,
      };
    }
  } catch (error) {
    console.error(error);
  }

  // Create user map for parsing mentions
  const teamUsers = await client.getTeamMembers(job.config.teamId);
  const planeProjectMembers = await planeClient?.users.listAllUsers(job.workspace_slug);

  const userMap = new Map<string, string>();
  // Map linear users to plane users
  teamUsers.nodes.forEach((user) => {
    const planeUser = planeProjectMembers?.find((planeUser) => planeUser.email === user.email);
    if (planeUser) {
      userMap.set(user.displayName, planeUser.id);
    }
  });

  const options: LinearContentParserConfig = {
    // Identifiers
    workspaceSlug: job.workspace_slug,
    projectId: job.project_id,
    // Client
    planeClient: planeClient as Client,
    linearService: client,
    // Download headers
    fileDownloadHeaders: imageDownloadHeaders as Record<string, string>,
    apiBaseUrl: env.API_BASE_URL,
    appBaseUrl: env.APP_BASE_URL,
    userMap: userMap,
  };

  const pages = await Promise.all(documents.map((document) => transformDocument(document as LinearDocument, options)));
  return pages;
};

// export const getTransformedTeams = async (
//   _job: Job<LinearConfig>,
//   entities: LinearEntity
// ): Promise<Partial<ExModule>[]> => {
//   const modulePromises = entities.teams.map(async (team: Team): Promise<Partial<ExModule>> => {
//     const issues = await team.issues()
//     return {
//       external_id: team.id,
//       external_source: E_IMPORTER_KEYS.LINEAR,
//       name: team.name,
//       description: team.description ?? "",
//       issues: issues.nodes.map((issue) => issue.id)
//     }
//   })

//   return Promise.all(modulePromises)
// }

// Transform Projects to Modules
export const getTransformedProjects = (job: TImportJob<LinearConfig>, entities: LinearEntity): Partial<ExModule>[] => {
  const modules = entities.projects.map((project): Partial<ExModule> => {
    const issues = project.issues;
    const transformedIssues = issues.map((issue: any) => issue.id); // TODO: fix types

    return {
      external_id: project.project.id,
      external_source: E_IMPORTER_KEYS.LINEAR,
      name: project.project.name,
      description: project.project.description ?? "",
      issues: transformedIssues,
    };
  });

  return modules as Partial<ExModule>[];
};
