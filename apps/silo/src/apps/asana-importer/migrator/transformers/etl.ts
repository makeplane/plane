// plane sdk
// silo asana
import {
  AsanaConfig,
  AsanaEntity,
  AsanaTask,
  AsanaUser,
  getRandomColor,
  transformCustomFieldOptions,
  transformCustomFields,
  transformCustomFieldValues,
  transformTask,
  transformUser,
  transformComments,
} from "@plane/etl/asana";
// silo core
import { TIssuePropertyValuesPayload } from "@plane/etl/core";
import {
  ExIssueComment,
  ExIssueLabel,
  ExIssueProperty,
  ExIssuePropertyOption,
  ExIssue as PlaneIssue,
  PlaneUser,
} from "@plane/sdk";
import { TImportJob } from "@plane/types";

/* ------------------ Transformers ----------------------
This file contains transformers for Asana entities, responsible
for converting the given Asana entities into Plane entities. The
transformation depends on the types exported by the source core,
and the core types need to be maintained to get the correct
transformation results.
--------------------- Transformers ---------------------- */

export const getTransformedTasks = async (
  job: TImportJob<AsanaConfig>,
  entities: AsanaEntity
): Promise<Partial<PlaneIssue>[]> => {
  const projectGid = job.config?.project.gid;
  const stateMap = job.config?.state || [];
  const prioritySettings = job.config?.priority || {};

  const issuePromises = entities.tasks.map((task: AsanaTask) =>
    transformTask(
      task,
      projectGid,
      entities.users,
      entities.tags,
      entities.attachments[task.gid],
      stateMap,
      prioritySettings
    )
  );

  return Promise.all(issuePromises);
};

export const getTransformedTags = (entities: AsanaEntity): Partial<ExIssueLabel>[] => {
  const labels = entities.tags.map((tag) => ({
    name: tag.name,
    color: getRandomColor(),
  }));

  labels.push({
    name: "Asana Imported",
    color: getRandomColor(),
  });

  return labels;
};

export const getTransformedUsers = (entities: AsanaEntity): Partial<PlaneUser>[] => entities.users.map(transformUser);

export const getTransformedCustomFields = (
  job: TImportJob<AsanaConfig>,
  entities: AsanaEntity
): Partial<ExIssueProperty>[] => {
  const priorityFieldGid = job.config?.priority?.custom_field_id;
  return entities.fields
    .map((fieldSettings) => transformCustomFields(fieldSettings, priorityFieldGid))
    .filter(Boolean) as Partial<ExIssueProperty>[];
};

export const getTransformedCustomFieldOptions = (
  job: TImportJob<AsanaConfig>,
  entities: AsanaEntity
): Partial<ExIssuePropertyOption>[] => {
  const priorityFieldGid = job.config?.priority?.custom_field_id;
  return entities.fields
    .filter(
      (field) =>
        field.custom_field?.type &&
        field.custom_field.gid !== priorityFieldGid &&
        ["enum", "multi_enum"].includes(field.custom_field.type)
    )
    .flatMap(
      (field) =>
        field.custom_field &&
        field.custom_field.enum_options &&
        field.custom_field.enum_options.map(
          (option) => field.custom_field?.gid && transformCustomFieldOptions(field.custom_field.gid, option)
        )
    )
    .filter(Boolean) as Partial<ExIssuePropertyOption>[];
};

export const getTransformedCustomFieldValues = (
  entities: AsanaEntity,
  planeIssueProperties: Partial<ExIssueProperty>[]
): TIssuePropertyValuesPayload => {
  // Get the plane issue properties map to only transform values for the properties that are present in the plane
  const planeIssuePropertiesMap = new Map<string, Partial<ExIssueProperty>>(
    planeIssueProperties
      .filter((property) => property.external_id)
      .map((property) => [property.external_id as string, property])
  );
  // Get asana users map to get the user object for the people field
  const asanaUsersMap = new Map<string, AsanaUser>(entities.users.map((user) => [user.gid, user]));
  // Get transformed values for issue_id -> property_id -> property_values
  const transformedIssuePropertyValues: TIssuePropertyValuesPayload = {};
  entities.tasks.forEach((task: AsanaTask) => {
    if (task.gid && task.custom_fields) {
      transformedIssuePropertyValues[task.gid] = transformCustomFieldValues(
        task,
        planeIssuePropertiesMap,
        asanaUsersMap
      );
    }
  });
  return transformedIssuePropertyValues;
};

export const getTransformedComments = (entities: AsanaEntity): Partial<ExIssueComment>[] => {
  const issueComments = entities.comments.map((comment) => transformComments(comment, entities.users));
  return issueComments.filter(Boolean) as Partial<ExIssueComment>[];
};
