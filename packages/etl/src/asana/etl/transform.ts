// plane sdk
import {
  ExIssueAttachment,
  ExIssueComment,
  ExIssueProperty,
  ExIssuePropertyOption,
  ExIssue as PlaneIssue,
  PlaneUser,
} from "@plane/sdk";
// helpers
import {
  getFormattedDate,
  getPropertyValues,
  getTargetAttachments,
  getTargetPriority,
  getTargetState,
  mapAsanaAssignee,
  mapAsanaCommentCreator,
  mapAsanaCreator,
  mapAsanaState,
} from "@/asana/helpers";
// types
import { CUSTOM_FIELD_ATTRIBUTES } from "@/asana/helpers/custom-field-etl";
import {
  AsanaCustomFieldSettings,
  AsanaEnumOption,
  AsanaTag,
  AsanaTask,
  AsanaTaskComment,
  AsanaUser,
  AsanaAttachment,
  PriorityConfigSettings,
  StateConfig,
} from "@/asana/types";
import { E_IMPORTER_KEYS, TPropertyValuesPayload } from "@/core";

export const transformTask = (
  task: AsanaTask,
  projectGid: string,
  users: AsanaUser[],
  tags: AsanaTag[],
  attachments: AsanaAttachment[],
  stateMap: StateConfig[],
  prioritySettings: PriorityConfigSettings
): Partial<PlaneIssue> => {
  const labels: string[] = ["Asana Imported"];
  const assignee = mapAsanaAssignee(task, users);
  const creator = mapAsanaCreator(task, users);
  const state = mapAsanaState(task, projectGid);
  const targetAttachments = getTargetAttachments(attachments);
  const targetState = state && getTargetState(stateMap, state);
  const { custom_field_id: priorityCustomFieldId, priority_config: priorityMap } = prioritySettings;
  let targetPriority = undefined;
  if (priorityCustomFieldId && priorityMap && priorityMap.length) {
    const priorityFieldValue = task.custom_fields.find((field) => field.gid === priorityCustomFieldId)?.enum_value;
    targetPriority = getTargetPriority(priorityMap, priorityFieldValue);
  }
  const parent = task.parent ? task.parent.gid : undefined;
  // Add tags to the labels
  if (task.tags) {
    const tagNames = task.tags
      .map((tag) => tags.find((t) => t.gid === tag.gid)?.name)
      .filter((name): name is string => !!name);
    labels.push(...tagNames);
  }
  // Add link to the asana task
  const links = [
    {
      name: "Linked Asana Task",
      url: task.permalink_url,
    },
  ];

  const issue: Partial<PlaneIssue> = {
    name: task.name || "Untitled Task",
    external_id: task.gid,
    external_source: E_IMPORTER_KEYS.ASANA,
    assignees: assignee ? [assignee] : [],
    parent,
    labels,
    links,
    attachments: targetAttachments as ExIssueAttachment[], // TODO: Fix this type
    state: targetState ? targetState.id : "",
    priority: targetPriority,
    description_html: !task.html_notes || task.html_notes == "<body></body>" ? "<p></p>" : task.html_notes,
    start_date: getFormattedDate(task.start_on),
    target_date: getFormattedDate(task.due_on),
    created_at: task.created_at,
    created_by: creator,
  };

  return issue;
};

export const transformUser = (user: AsanaUser): Partial<PlaneUser> => {
  const [first_name, ...lastNameParts] = user.name.split(" ");
  const last_name = lastNameParts.join(" ");
  const displayName = user.email.split("@")[0];

  return {
    first_name,
    last_name,
    email: user.email,
    display_name: displayName,
    role: 15,
  };
};

export const transformCustomFields = (
  fieldSettings: AsanaCustomFieldSettings,
  priorityFieldGid?: string
): Partial<ExIssueProperty> | undefined => {
  if (
    !fieldSettings.custom_field?.gid ||
    !fieldSettings.custom_field.type ||
    fieldSettings.custom_field.gid === priorityFieldGid ||
    fieldSettings.custom_field.is_formula_field === true ||
    fieldSettings.custom_field.is_value_read_only === true
  ) {
    return undefined;
  }
  // Get the property attributes
  const propertyAttributes = CUSTOM_FIELD_ATTRIBUTES[fieldSettings.custom_field.type];
  if (!propertyAttributes) {
    return undefined;
  }
  // Return the transformed property
  return {
    external_id: fieldSettings.custom_field.gid,
    external_source: E_IMPORTER_KEYS.ASANA,
    display_name: fieldSettings.custom_field.name,
    description: fieldSettings.custom_field.description ?? undefined,
    type_id: undefined, // Issue types not supported in Asana
    is_active: true,
    ...propertyAttributes,
  };
};

export const transformCustomFieldOptions = (
  customFieldGid: string,
  customFieldOption: AsanaEnumOption
): Partial<ExIssuePropertyOption> => ({
  external_id: customFieldOption.gid,
  external_source: E_IMPORTER_KEYS.ASANA,
  name: customFieldOption.name,
  is_active: customFieldOption.enabled,
  property_id: customFieldGid,
});

export const transformCustomFieldValues = (
  task: AsanaTask,
  // eslint-disable-next-line no-undef
  planeIssueProperties: Map<string, Partial<ExIssueProperty>>, // TODO: Replace Map with Record<string, Partial<ExIssueProperty>> in the future
  // eslint-disable-next-line no-undef
  asanaUsersMap: Map<string, AsanaUser> // TODO: Replace Map with Record<string, AsanaUser> in the future
): TPropertyValuesPayload => {
  // Get transformed values for property_id -> property_values
  const propertyValuesPayload: TPropertyValuesPayload = {};
  task.custom_fields.forEach((customField) => {
    const property = planeIssueProperties.get(customField.gid);
    if (property && property.external_id && customField.gid && customField.type) {
      propertyValuesPayload[property.external_id] = getPropertyValues(customField, asanaUsersMap);
    }
  });
  return propertyValuesPayload;
};

export const transformComments = (comment: AsanaTaskComment, users: AsanaUser[]): Partial<ExIssueComment> => {
  const creator = mapAsanaCommentCreator(comment, users);
  return {
    external_id: comment.gid,
    external_source: E_IMPORTER_KEYS.ASANA,
    created_at: getFormattedDate(comment.created_at),
    comment_html: comment.html_text ?? "<p></p>",
    actor: creator,
    issue: comment.task_gid,
  };
};
