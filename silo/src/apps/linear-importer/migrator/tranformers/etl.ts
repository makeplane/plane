import { Issue, IssueLabel } from "@linear/sdk";
import { ExCycle, ExIssueComment, ExIssueLabel, ExModule, ExIssue as PlaneIssue, PlaneUser } from "@plane/sdk";
import { TJobWithConfig } from "@silo/core";
import { transformComment, transformCycle, transformIssue, transformUser } from "@silo/linear";
import { getRandomColor } from "../../helpers/generic-helpers";
import { LinearConfig, LinearEntity } from "@silo/linear";

/* ------------------ Transformers ----------------------
This file contains transformers for Linear entities, responsible
for converting the given Linear entities into Plane entities. The
transformation depends on the types exported by the source core,
and the core types need to be maintained to get the correct
transformation results.
--------------------- Transformers ---------------------- */

export const getTransformedIssues = async (
  job: TJobWithConfig<LinearConfig>,
  entities: LinearEntity
): Promise<Partial<PlaneIssue>[]> => {
  const teamUrl = job.config?.meta.teamUrl || "";
  const stateMap = job.config?.meta.state || [];

  const issuePromises = entities.issues.map(async (issue: Issue) => {
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

export const getTransformedLabels = (
  _job: TJobWithConfig<LinearConfig>,
  entities: LinearEntity
): Partial<ExIssueLabel>[] => {
  return entities.labels.map((label: IssueLabel): Partial<ExIssueLabel> => {
    return {
      name: label.name,
      color: label.color ?? getRandomColor(),
    };
  });
};

export const getTransformedComments = (
  _job: TJobWithConfig<LinearConfig>,
  entities: LinearEntity
): Partial<ExIssueComment>[] => {
  const commentPromises = entities.issue_comments.map((comment) => {
    return transformComment(comment, entities.users);
  });
  return commentPromises;
};

export const getTransformedUsers = (
  _job: TJobWithConfig<LinearConfig>,
  entities: LinearEntity
): Partial<PlaneUser>[] => {
  return entities.users.map(transformUser);
};

export const getTransformedCycles = (
  _job: TJobWithConfig<LinearConfig>,
  entities: LinearEntity
): Partial<ExCycle>[] => {
  const cyclePromises = entities.cycles.map(transformCycle);
  return cyclePromises;
};

// export const getTransformedTeams = async (
//   _job: Job<LinearConfig>,
//   entities: LinearEntity
// ): Promise<Partial<ExModule>[]> => {
//   const modulePromises = entities.teams.map(async (team: Team): Promise<Partial<ExModule>> => {
//     const issues = await team.issues()
//     return {
//       external_id: team.id,
//       external_source: "LINEAR",
//       name: team.name,
//       description: team.description ?? "",
//       issues: issues.nodes.map((issue) => issue.id)
//     }
//   })

//   return Promise.all(modulePromises)
// }

// Transform Projects to Modules
export const getTransformedProjects = (
  job: TJobWithConfig<LinearConfig>,
  entities: LinearEntity
): Partial<ExModule>[] => {
  const modules = entities.projects.map((project): Partial<ExModule> => {
    const issues = project.issues;
    const transformedIssues = issues.map((issue: Issue) => {
      return issue.id;
    });

    return {
      external_id: project.project.id,
      external_source: "LINEAR",
      name: project.project.name,
      description: project.project.description ?? "",
      issues: transformedIssues,
    };
  });

  return modules as Partial<ExModule>[];
};
