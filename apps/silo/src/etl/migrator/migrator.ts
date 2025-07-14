import { v4 as uuidv4 } from "uuid";
import { E_FEATURE_FLAGS, PlaneEntities, E_IMPORTER_KEYS } from "@plane/etl/core";
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
  PlaneUser,
} from "@plane/sdk";
import { TImportJob } from "@plane/types";
import {
  IMPORT_JOB_PLANE_ISSUE_PROPERTIES_CACHE_KEY,
  IMPORT_JOB_PLANE_ISSUE_PROPERTY_OPTIONS_CACHE_KEY,
  IMPORT_JOB_PLANE_ISSUE_TYPES_CACHE_KEY,
  IMPORT_JOB_FIRST_PAGE_PUSHED_CACHE_KEY,
} from "@/helpers/cache-keys";
import { IMPORT_JOB_KEYS_TTL_IN_SECONDS } from "@/helpers/constants";
import { updateJobWithReport } from "@/helpers/job";
import { getPlaneAPIClient, getPlaneFeatureFlagService } from "@/helpers/plane-api-client";
import { protect } from "@/lib";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { celeryProducer } from "@/worker";
import { Store } from "@/worker/base";
import { createAllCycles } from "./cycles.migrator";
import { getCredentialsForMigration, validateJobForMigration } from "./helpers";
import {
  createOrUpdateIssueTypes,
  createOrUpdateIssueProperties,
  createOrUpdateIssuePropertiesOptions,
} from "./issue-types";
import { generateIssuePayload } from "./issues.migrator";
import { createLabelsForIssues } from "./labels.migrator";
import { createAllModules } from "./modules.migrator";
import { createUsers } from "./users.migrator";

export async function migrateToPlane(job: TImportJob, data: PlaneEntities[], meta: any) {
  try {
    validateJobForMigration(job);
    const credentials = await getCredentialsForMigration(job);

    const planeClient = await getPlaneAPIClient(credentials, E_IMPORTER_KEYS.IMPORTER);

    const featureFlagService = await getPlaneFeatureFlagService();

    const [planeEntities] = data;

    const { labels, issues, users, issue_comments, cycles, modules, issue_property_values } = planeEntities;

    // Create the data required for the workspace
    let planeLabels: ExIssueLabel[] = [];
    let planeUsers: PlaneUser[] = [];
    let planeIssueTypes: ExIssueType[] = [];
    let planeIssueProperties: ExIssueProperty[] = [];
    let planeIssuePropertiesOptions: ExIssuePropertyOption[] = [];
    let defaultIssueType: ExIssueType | undefined = undefined;

    // Get the labels and issues from the Plane API
    try {
      const response = await protect(
        planeClient.label.list.bind(planeClient.label),
        job.workspace_slug,
        job.project_id
      );
      planeLabels = response.results;
      planeUsers = await protect(planeClient.users.list.bind(planeClient.users), job.workspace_slug, job.project_id);
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
    const isIssueTypeFeatureEnabled = await featureFlagService.featureFlags({
      workspace_slug: job.workspace_slug,
      user_id: job.initiator_id,
      flag_key: E_FEATURE_FLAGS.ISSUE_TYPES,
    });

    /* ------------------- Cache Management (TODO: Remove this later) -------------------- */
    const issueTypesCacheKey = IMPORT_JOB_PLANE_ISSUE_TYPES_CACHE_KEY(job.id);
    const issuePropertiesCacheKey = IMPORT_JOB_PLANE_ISSUE_PROPERTIES_CACHE_KEY(job.id);
    const issuePropertyOptionsCacheKey = IMPORT_JOB_PLANE_ISSUE_PROPERTY_OPTIONS_CACHE_KEY(job.id);

    const store = Store.getInstance();

    const cachedIssueTypes = await store.get(issueTypesCacheKey);
    if (cachedIssueTypes) {
      logger.info(`Found cached issue types`, { jobId: job.id });
      planeIssueTypes = JSON.parse(cachedIssueTypes);
    }
    const cachedIssueProperties = await store.get(issuePropertiesCacheKey);
    if (cachedIssueProperties) {
      logger.info(`Found cached issue properties`, { jobId: job.id });
      planeIssueProperties = JSON.parse(cachedIssueProperties);
    }
    const cachedIssuePropertyOptions = await store.get(issuePropertyOptionsCacheKey);
    if (cachedIssuePropertyOptions) {
      logger.info(`Found cached issue property options`, { jobId: job.id });
      planeIssuePropertiesOptions = JSON.parse(cachedIssuePropertyOptions);
    }

    const triggerIssueTypeStep =
      isIssueTypeFeatureEnabled && (!cachedIssueTypes || !cachedIssueProperties || !cachedIssuePropertyOptions);

    /* ------------------- Issue Type Creation -------------------- */
    if (triggerIssueTypeStep) {
      // 2. Check if issue type is enabled for the project or not.
      const planeProjectDetails = await protect<ExProject>(
        planeClient.project.getProject.bind(planeClient.project),
        job.workspace_slug,
        job.project_id
      );
      // Extract the issue types from the plane entities
      const isIssueTypeEnabledForProject = planeProjectDetails.is_issue_type_enabled;
      const { issue_types, issue_properties, issue_property_options } = planeEntities;
      if (isIssueTypeEnabledForProject && issue_types?.length) {
        // Create a map for quick lookup of existing issue types by external id
        // --------------------------- Issue Type Creation Start ---------------------------
        const existingIssueTypes = new Map();
        // Get existing Plane issue types
        try {
          const response: ExIssueType[] = await protect(
            planeClient.issueType.fetch.bind(planeClient.issueType),
            job.workspace_slug,
            job.project_id
          );
          response.forEach((issueType: ExIssueType) => {
            existingIssueTypes.set(issueType.external_id, issueType);
            if (issueType.is_default) {
              defaultIssueType = issueType;
            }
          });
        } catch (error) {
          logger.error("Error while fetching the issue types from the Plane API", {
            jobId: job.id,
            error: error,
          });
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
            const response: ExIssueProperty[] = await protect(
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
          logger.error("Error while fetching the issue properties from the Plane API", {
            jobId: job.id,
            error: error,
          });
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
              const response: ExIssuePropertyOption[] = await protect(
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
          logger.error("Error while fetching the issue property options from the Plane API", {
            jobId: job.id,
            error: error,
          });
        }

        // Create the issue properties that are not present in Plane
        const issuePropertiesOptionToCreate = issue_property_options?.filter(
          (issuePropertyOption) => !existingIssuePropertyOptions.has(issuePropertyOption.external_id?.toString() || "")
        );

        // Update the issue properties that are present in Plane
        const issuePropertiesOptionToUpdate = issue_property_options
          ?.filter((issuePropertyOption) =>
            existingIssuePropertyOptions.has(issuePropertyOption.external_id?.toString() || "")
          )
          .map((issuePropertyOption) => ({
            ...existingIssuePropertyOptions.get(issuePropertyOption.external_id?.toString() || ""),
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

    const planeCycles = await createAllCycles(
      job.id,
      cycles as ExCycle[],
      planeClient,
      job.workspace_slug,
      job.project_id
    );

    // ------------------- Module Creation --------------------
    const planeModules = await createAllModules(
      job.id,
      modules as ExModule[],
      planeClient,
      job.workspace_slug,
      job.project_id
    );

    // ------------------- Issue Type Cache Storage -------------------- if the issue type step is triggered
    if (triggerIssueTypeStep) {
      logger.info("Caching issue types, properties and property options, and setting the first page pushed cache key", {
        jobId: job.id,
      });
      await store.set(issueTypesCacheKey, JSON.stringify(planeIssueTypes), IMPORT_JOB_KEYS_TTL_IN_SECONDS);
      await store.set(issuePropertiesCacheKey, JSON.stringify(planeIssueProperties), IMPORT_JOB_KEYS_TTL_IN_SECONDS);
      await store.set(
        issuePropertyOptionsCacheKey,
        JSON.stringify(planeIssuePropertiesOptions),
        IMPORT_JOB_KEYS_TTL_IN_SECONDS
      );
      await store.set(IMPORT_JOB_FIRST_PAGE_PUSHED_CACHE_KEY(job.id), "true", IMPORT_JOB_KEYS_TTL_IN_SECONDS * 4);
    }
    // ------------------- Issue Type Cache Storage --------------------

    const generatedIssuePayload = await generateIssuePayload({
      jobId: job.id,
      meta,
      issueProcessIndex,
      planeClient,
      workspaceSlug: job.workspace_slug,
      projectId: job.project_id,
      credentials: credentials,

      // Issues that needs to be processed
      issues: issues as ExIssue[],

      // Plane Properties, that are sent
      users: planeUsers,
      cycles: planeCycles,
      modules: planeModules,
      planeLabels: planeLabels,
      issueComments: issue_comments as ExIssueComment[],

      // Issue Types
      planeIssueTypes,
      planeIssueProperties,
      planeIssuePropertiesOptions,
      planeIssuePropertyValues: issue_property_values ? issue_property_values : {},
    });

    const payload = {
      issues: generatedIssuePayload,
      phase: meta.phase,
      isLastBatch: meta.isLastBatch,
    };

    await celeryProducer.registerTask(
      payload,
      job.workspace_slug,
      job.project_id,
      job.id,
      credentials.user_id,
      uuidv4(),
      "plane.bgtasks.data_import_task.import_data"
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[${job.id}] Error while migrating the data to Plane: ${errorMessage}`);
    throw error;
  }
}
