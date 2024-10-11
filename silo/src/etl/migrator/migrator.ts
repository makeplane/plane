import {
  ExCycle,
  ExIssue,
  ExIssueComment,
  ExIssueLabel,
  ExModule,
  ExState,
  Client as PlaneClient,
  PlaneEntities,
  PlaneUser,
} from "@plane/sdk";
import { protect } from "@/lib";
import { logger } from "@/logger";
import { TSyncJobWithConfig } from "@silo/core";
import { createCycles } from "./cycles.migrator";
import { getCredentialsForMigration, validateJobForMigration } from "./helpers";
import { createIssuesWithParent, createOrphanIssues, createOrUpdateIssueComment } from "./issues.migrator";
import { createLabelsForIssues } from "./labels.migrator";
import { createModules } from "./modules.migrator";
import { createStates } from "./states.migrator";
import { createUsers } from "./users.migrator";

export async function migrateToPlane(job: TSyncJobWithConfig, data: PlaneEntities[], meta: any) {
  validateJobForMigration(job);
  const credentials = await getCredentialsForMigration(job);

  const planeClient = new PlaneClient({
    baseURL: job.target_hostname,
    apiToken: credentials.target_access_token,
  });

  const [planeEntities] = data;

  if (!job.config) {
    throw new Error(`[${job.id}] No config found in the job data. Exiting...`);
  }

  let planeStates: { target_state: ExState; source_state: any }[] = (job.config?.meta as any).state;

  try {
    const metaJobData = job.config?.meta as {
      state: { target_state: ExState; source_state: any }[];
    };

    const statesToCreate = metaJobData.state.filter((state) => state.target_state.status === "to_be_created");

    const createdStates = await createStates(job.id, statesToCreate, planeClient, job.workspace_slug, job.project_id);

    // create a map for quick lookup of created states by source state id
    const createdStatesMap = new Map(createdStates.map((createdState) => [createdState.source_state.id, createdState]));

    // replace the to_be_created states with actually created states
    planeStates = metaJobData.state.map((state: any) => {
      if (state.target_state.status === "to_be_created") {
        return createdStatesMap.get(state.source_state.id) || state;
      }
      return state;
    });
  } catch (error) {
    throw new Error(
      `[${job.id}] Error while creating the states in the Plane API, which needs to be available to continue the migration`
    );
  }

  const { labels, issues: issuesBefore, users, issue_comments, cycles, modules } = planeEntities;

  // Update the state of the issues with all the states created in the previous step
  const issues = issuesBefore.map((issue) => {
    // we have the states as "" by default if the states aren't created yet in
    // Plane, so we need to update the state of the issue with the actual state
    // after creating the states above
    if (issue.state === "") {
      // put the newly created Plane state's id in the issue
      issue.state = planeStates.find((state) => {
        return state.source_state.id === issue.external_source_state_id;
      })?.target_state.id;
    }
    return issue;
  });

  // Create the users required for the workspace
  let planeLabels: ExIssueLabel[] = [];
  let planeUsers: PlaneUser[] = [];

  let shouldContinue = true;

  // Get the labels and issues from the Plane API
  try {
    const response: any = await protect(
      planeClient.label.list.bind(planeClient.label),
      job.workspace_slug,
      job.project_id
    );
    planeLabels = response.results;
    planeUsers = await protect(planeClient.users.list.bind(planeClient.users), job.workspace_slug, job.project_id);
    shouldContinue = false;
  } catch (error) {
    logger.error(
      `[${job.id}] Error while fetching the labels and users from the Plane API, which needs to be available to continue the migration`,
      error
    );
    throw new Error(
      "Error while fetching the labels and users from the Plane API, which needs to be available to continue the migration"
    );
  }

  // Update display name for plane existing users, for processing
  /*
   * Say an existing user in plane has the same user email as the user in the source system, but the display name is different.
   * In that case, we need to update the display name of the user in the plane to match the display name of the user in the source system.
   * As the importer will use the display name from the source system.
   */
  for (const user of users) {
    const planeUser = planeUsers.find((planeUser) => planeUser.email === user.email);
    if (planeUser && user.display_name) {
      planeUser.display_name = user.display_name;
    }
  }

  /* ------------------- Append Labels and Users -------------------- */
  const usersToAppend = users.filter((user) => !planeUsers.find((planeUser) => planeUser.email === user.email));
  planeUsers.push(
    ...(await createUsers(job.id, usersToAppend as PlaneUser[], planeClient, job.workspace_slug, job.project_id))
  );
  const labelsToAppend = labels.filter((label) => !planeLabels.find((planeLabel) => planeLabel.name === label.name));
  planeLabels.push(
    ...(await createLabelsForIssues(
      job.id,
      labelsToAppend as ExIssueLabel[],
      planeClient,
      job.workspace_slug,
      job.project_id
    ))
  );

  const orphanIssues = issues.filter((issue) => issue.parent === undefined);
  const issuesWithParent = issues.filter((issue) => issue.parent !== undefined);

  /* ------------------- Start Creating the Issues -------------------- */
  // Batch Start Index
  let issueProcessIndex = meta.batch_start;

  // Create orphan issues, i.e. issues without a parent
  const createdOrphanIssues = await createOrphanIssues({
    jobId: job.id,
    meta,
    planeLabels,
    issueProcessIndex,
    planeClient,
    workspaceSlug: job.workspace_slug,
    projectId: job.project_id,
    users: planeUsers,
    issues: orphanIssues as ExIssue[],
    sourceAccessToken: credentials.source_access_token as string,
  });

  // Create issues with parent present
  const createdIssuesWithParent = await createIssuesWithParent({
    jobId: job.id,
    meta,
    planeLabels,
    issueProcessIndex,
    planeClient,
    workspaceSlug: job.workspace_slug,
    projectId: job.project_id,
    users: planeUsers,
    issuesWithParent: issuesWithParent as ExIssue[],
    createdOrphanIssues,
    sourceAccessToken: credentials.source_access_token as string,
  });

  const allIssues = [...createdOrphanIssues, ...createdIssuesWithParent];

  // Create comments for the issues migrated
  const commentPromises = issue_comments.map(async (comment) => {
    const issue = allIssues.find((issue) => issue.external_id === comment.issue);
    const actor = planeUsers.find((user) => user.display_name === comment.actor);
    const createdBy = planeUsers.find((user) => user.display_name === comment.created_by);

    if (issue) {
      comment.issue = issue.id;
      if (actor && createdBy) {
        comment.actor = actor.id;
        comment.created_by = createdBy.id;
      } else {
        delete comment.actor;
        delete comment.created_by;
      }
      return createOrUpdateIssueComment(
        job.id,
        comment as ExIssueComment,
        planeClient,
        job.workspace_slug,
        job.project_id,
        issue.id
      );
    }
  });

  const cyclesPromise = createCycles(
    job.id,
    cycles as ExCycle[],
    allIssues,
    planeClient,
    job.workspace_slug,
    job.project_id
  );
  const modulesPromise = createModules(
    job.id,
    modules as ExModule[],
    allIssues,
    planeClient,
    job.workspace_slug,
    job.project_id
  );

  await Promise.all([...commentPromises, cyclesPromise, modulesPromise]);
}
