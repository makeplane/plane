import {
  EIssuePropertyType,
  ExCycle,
  ExIssue,
  ExIssueComment,
  ExIssueLabel,
  ExIssueProperty,
  ExIssuePropertyOption,
  ExIssueType,
  ExModule,
  ExProject,
  ExState,
  Client as PlaneClient,
  PlaneUser,
} from "@plane/sdk";
import { env } from "@/env";
import { protect } from "@/lib";
import { logger } from "@/logger";
import { FeatureFlagService, TJobWithConfig, E_FEATURE_FLAGS, PlaneEntities } from "@silo/core";
import { createCycles } from "./cycles.migrator";
import { getCredentialsForMigration, validateJobForMigration } from "./helpers";
import { createIssues, createOrUpdateIssueComment } from "./issues.migrator";
import { createLabelsForIssues } from "./labels.migrator";
import { createModules } from "./modules.migrator";
import { createStates } from "./states.migrator";
import { createUsers } from "./users.migrator";
import {
  createOrUpdateIssueTypes,
  createOrUpdateIssueProperties,
  createOrUpdateIssuePropertiesOptions,
} from "./issue-types";

export async function migrateToPlane(job: TJobWithConfig, data: PlaneEntities[], meta: any) {
  validateJobForMigration(job);
  const credentials = await getCredentialsForMigration(job);

  const planeClient = new PlaneClient({
    baseURL: env.API_BASE_URL,
    apiToken: credentials.target_access_token,
  });

  const featureFlagService = new FeatureFlagService(env.FEATURE_FLAG_SERVER_BASE_URL || "", {
    x_api_key: env.FEATURE_FLAG_SERVER_AUTH_TOKEN || "",
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

  const { labels, issues: issuesBefore, users, issue_comments, cycles, modules, issue_property_values } = planeEntities;

  // Update the state of the issues with all the states created in the previous step
  const issues = issuesBefore.map((issue) => {
    // we have the states as "" by default if the states aren't created yet in
    // Plane, so we need to update the state of the issue with the actual state
    // after creating the states above
    if (issue.state === "") {
      // put the newly created Plane state's id in the issue
      issue.state = planeStates.find(
        (state) => state.source_state.id === issue.external_source_state_id
      )?.target_state.id;
    }
    return issue;
  });

  // Create the data required for the workspace
  let planeLabels: ExIssueLabel[] = [];
  let planeUsers: PlaneUser[] = [];
  const planeIssueTypes: ExIssueType[] = [];
  const planeIssueProperties: ExIssueProperty[] = [];
  const planeIssuePropertiesOptions: ExIssuePropertyOption[] = [];
  let defaultIssueType: ExIssueType | undefined = undefined;

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
    console.log(planeUsers);
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
    ...(await createUsers(
      job.id,
      usersToAppend as PlaneUser[],
      planeClient,
      credentials,
      job.workspace_slug,
      job.project_id
    ))
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

  /* ------------------- Issue Types -------------------- */
  const isIssueTypeFeatureEnabled = true;

  if (isIssueTypeFeatureEnabled) {
    // 2. Check if issue type is enabled for the project or not.
    const planeProjectDetails = await protect<ExProject>(
      planeClient.project.getProject.bind(planeClient.project),
      job.workspace_slug,
      job.project_id
    );
    const isIssueTypeEnabledForProject = planeProjectDetails.is_issue_type_enabled;
    if (isIssueTypeEnabledForProject) {
      // Extract the issue types from the plane entities
      const { issue_types, issue_properties, issue_property_options } = planeEntities;
      // Create a map for quick lookup of existing issue types by external id

      // --------------------------- Issue Type Creation Start ---------------------------
      const existingIssueTypes = new Map();
      // Get existing Plane issue types
      try {
        const response: any = await protect(
          planeClient.issueType.fetch.bind(planeClient.issueType),
          job.workspace_slug,
          job.project_id
        );
        response.results.forEach((issueType: ExIssueType) => {
          existingIssueTypes.set(issueType.external_id, issueType);
          if (issueType.is_default) {
            defaultIssueType = issueType;
          }
        });
      } catch (error) {
        logger.error(`[${job.id}] Error while fetching the issue types from the Plane API`, error);
      }

      // Create the issue types that are not present in Plane
      const issueTypesToCreate = issue_types?.filter((issueType) => !existingIssueTypes.has(issueType.external_id));
      // Update the issue types that are present in Plane
      const issueTypesToUpdate = issue_types
        ?.filter((issueType) => existingIssueTypes.has(issueType.external_id))
        .map((issueType) => ({
          ...existingIssueTypes.get(issueType.external_id),
          ...issueType,
        }));

      if (defaultIssueType) {
        planeIssueTypes.push(defaultIssueType);
      }

      if (issueTypesToCreate && issueTypesToCreate.length > 0) {
        planeIssueTypes.push(
          ...(await createOrUpdateIssueTypes({
            jobId: job.id,
            issueTypes: issueTypesToCreate,
            planeClient,
            workspaceSlug: job.workspace_slug,
            projectId: job.project_id,
            method: "create",
          }))
        );
      }

      if (issueTypesToUpdate && issueTypesToUpdate.length > 0) {
        planeIssueTypes.push(
          ...(await createOrUpdateIssueTypes({
            jobId: job.id,
            issueTypes: issueTypesToUpdate,
            planeClient,
            workspaceSlug: job.workspace_slug,
            projectId: job.project_id,
            method: "update",
          }))
        );
      }
      // --------------------------- Issue Type Creation End ---------------------------

      // --------------------------- Issue Custom Properties Creation Start ---------------------------
      const planeIssueTypesMap = new Map(planeIssueTypes.map((issueType) => [issueType.external_id, issueType]));
      const existingIssueProperties = new Map<string, ExIssueProperty>();
      // Get existing Plane issue properties
      try {
        for (const issueType of planeIssueTypes) {
          const response: any = await protect(
            planeClient.issueProperty.fetch.bind(planeClient.issueProperty),
            job.workspace_slug,
            job.project_id,
            issueType.id
          );
          response.forEach((issueProperty: ExIssueProperty) => {
            existingIssueProperties.set(issueProperty.external_id, issueProperty);
          });
        }
      } catch (error) {
        logger.error(`[${job.id}] Error while fetching the issue properties from the Plane API`, error);
      }

      // Create the issue properties that are not present in Plane
      const issuePropertiesToCreate = issue_properties?.filter(
        (issueProperty) => !existingIssueProperties.has(issueProperty.external_id || "")
      );
      // Update the issue properties that are present in Plane
      const issuePropertiesToUpdate = issue_properties
        ?.filter((issueProperty) => existingIssueProperties.has(issueProperty.external_id || ""))
        .map((issueProperty) => ({
          ...existingIssueProperties.get(issueProperty.external_id || ""),
          ...issueProperty,
        }));

      if (issuePropertiesToCreate && issuePropertiesToCreate.length > 0) {
        planeIssueProperties.push(
          ...(await createOrUpdateIssueProperties({
            jobId: job.id,
            issueTypesMap: planeIssueTypesMap,
            defaultIssueType,
            issueProperties: issuePropertiesToCreate,
            planeClient,
            workspaceSlug: job.workspace_slug,
            projectId: job.project_id,
            method: "create",
          }))
        );
      }

      if (issuePropertiesToUpdate && issuePropertiesToUpdate.length > 0) {
        planeIssueProperties.push(
          ...(await createOrUpdateIssueProperties({
            jobId: job.id,
            issueTypesMap: planeIssueTypesMap,
            defaultIssueType,
            issueProperties: issuePropertiesToUpdate,
            planeClient,
            workspaceSlug: job.workspace_slug,
            projectId: job.project_id,
            method: "update",
          }))
        );
      }
      // --------------------------- Issue Custom Properties Creation End ---------------------------

      // --------------------------- Issue Property Options Creation Start ---------------------------
      const planeIssuePropertiesMap = new Map(
        planeIssueProperties.map((issueProperty) => [issueProperty.external_id, issueProperty])
      );
      const existingIssuePropertyOptions = new Map<string, ExIssuePropertyOption>();
      // Get existing Plane issue property options
      try {
        for (const issueProperty of planeIssueProperties) {
          if (issueProperty.property_type === EIssuePropertyType.OPTION) {
            const response: any = await protect(
              planeClient.issuePropertyOption.fetch.bind(planeClient.issuePropertyOption),
              job.workspace_slug,
              job.project_id,
              issueProperty.id
            );
            response.forEach((issuePropertyOption: ExIssuePropertyOption) => {
              existingIssuePropertyOptions.set(issuePropertyOption.external_id, issuePropertyOption);
            });
          }
        }
      } catch (error) {
        logger.error(`[${job.id}] Error while fetching the issue properties from the Plane API`, error);
      }
      // Create the issue properties that are not present in Plane
      const issuePropertiesOptionToCreate = issue_property_options?.filter(
        (issuePropertyOption) => !existingIssuePropertyOptions.has(issuePropertyOption.external_id || "")
      );

      // Update the issue properties that are present in Plane
      const issuePropertiesOptionToUpdate = issue_property_options
        ?.filter((issuePropertyOption) => existingIssuePropertyOptions.has(issuePropertyOption.external_id || ""))
        .map((issuePropertyOption) => ({
          ...existingIssuePropertyOptions.get(issuePropertyOption.external_id || ""),
          ...issuePropertyOption,
        }));

      if (issuePropertiesOptionToCreate && issuePropertiesOptionToCreate.length > 0) {
        planeIssuePropertiesOptions.push(
          ...(await createOrUpdateIssuePropertiesOptions({
            jobId: job.id,
            issuePropertyMap: planeIssuePropertiesMap,
            issuePropertiesOptions: issuePropertiesOptionToCreate,
            planeClient,
            workspaceSlug: job.workspace_slug,
            projectId: job.project_id,
            method: "create",
          }))
        );
      }

      if (issuePropertiesOptionToUpdate && issuePropertiesOptionToUpdate.length > 0) {
        planeIssuePropertiesOptions.push(
          ...(await createOrUpdateIssuePropertiesOptions({
            jobId: job.id,
            issuePropertyMap: planeIssuePropertiesMap,
            issuePropertiesOptions: issuePropertiesOptionToUpdate,
            planeClient,
            workspaceSlug: job.workspace_slug,
            projectId: job.project_id,
            method: "update",
          }))
        );
      }
      // --------------------------- Issue Property Options Creation End -----------------------------
    }
  }

  /* ------------------- Start Creating the Issues -------------------- */
  // Batch Start Index
  const issueProcessIndex = meta.batch_start;

  const createdIssues = await createIssues({
    jobId: job.id,
    meta,
    planeLabels,
    issueProcessIndex,
    planeClient,
    workspaceSlug: job.workspace_slug,
    projectId: job.project_id,
    users: planeUsers,
    issues: issues as ExIssue[],
    credentials: credentials,
    planeIssueTypes,
    planeIssueProperties,
    planeIssuePropertiesOptions,
    planeIssuePropertyValues: isIssueTypeFeatureEnabled && issue_property_values ? issue_property_values : {},
  });

  const allIssues = createdIssues;

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
