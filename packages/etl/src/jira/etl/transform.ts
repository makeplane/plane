import { IssueTypeDetails as JiraIssueTypeDetails } from "jira.js/out/version3/models";
import {
  ExCycle,
  ExIssueComment,
  ExIssueLabel,
  ExIssueType,
  ExModule,
  ExIssue as PlaneIssue,
  ExIssueProperty,
  PlaneUser,
  ExIssuePropertyOption,
} from "@plane/sdk";
import { E_IMPORTER_KEYS, TPropertyValuesPayload } from "@/core";
import {
  IJiraIssue,
  ImportedJiraUser,
  IPriorityConfig,
  IStateConfig,
  JiraComment,
  JiraComponent,
  JiraSprint,
  JiraCustomFieldKeys,
  JiraIssueField,
  JiraIssueFieldOptions,
} from "@/jira/types";
import {
  getFormattedDate,
  getPropertyAttributes,
  getPropertyValues,
  getRandomColor,
  getTargetAttachments,
  getTargetPriority,
  getTargetState,
  SUPPORTED_CUSTOM_FIELD_ATTRIBUTES,
} from "../helpers";

export const transformIssue = (
  resourceId: string,
  projectId: string,
  issue: IJiraIssue,
  resourceUrl: string,
  stateMap: IStateConfig[],
  priorityMap: IPriorityConfig[]
): Partial<PlaneIssue> => {
  const targetState = getTargetState(stateMap, issue.fields.status);
  const targetPriority = getTargetPriority(priorityMap, issue.fields.priority);
  const attachments = getTargetAttachments(resourceId, projectId, issue.fields.attachment);
  const renderedFields = (issue.renderedFields as { description: string }) ?? {
    description: "<p></p>",
  };
  const links = [
    {
      name: "Linked Jira Issue",
      url: `${resourceUrl}/browse/${issue.key}`,
    },
  ];
  let description = renderedFields.description ?? "<p></p>";
  if (description === "") {
    description = "<p></p>";
  }

  issue.fields.labels.push("JIRA IMPORTED");

  return {
    assignees: issue.fields.assignee?.displayName ? [issue.fields.assignee.displayName] : [],
    links,
    external_id: `${projectId}_${resourceId}_${issue.id}`,
    external_source: E_IMPORTER_KEYS.JIRA,
    created_by: issue.fields.creator?.displayName,
    name: issue.fields.summary ?? "Untitled",
    description_html: description,
    target_date: issue.fields.duedate,
    start_date: issue.fields.customfield_10015,
    created_at: issue.fields.created,
    attachments: attachments,
    state: targetState?.id ?? "",
    external_source_state_id: targetState?.external_id ?? "",
    priority: targetPriority ?? "none",
    labels: issue.fields.labels,
    parent: `${projectId}_${resourceId}_${issue.fields.parent?.id}`,
    type_id: issue.fields.issuetype?.id,
  } as unknown as PlaneIssue;
};

export const transformLabel = (label: string): Partial<ExIssueLabel> => ({
  name: label,
  color: getRandomColor(),
});

export const transformComment = (
  resourceId: string,
  projectId: string,
  comment: JiraComment
): Partial<ExIssueComment> => ({
  external_id: `${projectId}_${resourceId}_${comment.id}`,
  external_source: E_IMPORTER_KEYS.JIRA,
  created_at: getFormattedDate(comment.created),
  created_by: comment.author?.displayName,
  comment_html: comment.renderedBody ?? "<p></p>",
  actor: comment.author?.displayName,
  issue: comment.issue_id,
});

export const transformUser = (user: ImportedJiraUser): Partial<PlaneUser> => {
  const [first_name, last_name] = user.user_name.split(" ");
  const role = user.org_role && user.org_role.toLowerCase().includes("admin") ? 20 : 15;

  return {
    email: user.email,
    display_name: user.user_name,
    first_name: first_name ?? "",
    last_name: last_name ?? "",
    role,
  };
};

export const transformSprint = (resourceId: string, projectId: string, sprint: JiraSprint): Partial<ExCycle> => ({
  external_id: `${projectId}_${resourceId}_${sprint.sprint.id.toString()}`,
  external_source: E_IMPORTER_KEYS.JIRA,
  name: sprint.sprint.name,
  start_date: getFormattedDate(sprint.sprint.startDate),
  end_date: getFormattedDate(sprint.sprint.endDate),
  created_at: getFormattedDate(sprint.sprint.createdDate),
  issues: sprint.issues.map((issue) => issue.id),
});

export const transformComponent = (
  resourceId: string,
  projectId: string,
  component: JiraComponent
): Partial<ExModule> => ({
  external_id: `${projectId}_${resourceId}_${component.component.id}`,
  external_source: E_IMPORTER_KEYS.JIRA,
  name: component.component.name,
  issues: component.issues.map((issue) => issue.id),
});

export const transformIssueType = (resourceId: string, projectId: string, issueType: JiraIssueTypeDetails): Partial<ExIssueType> => ({
  name: issueType.name,
  description: issueType.description,
  is_active: true,
  external_id: `${projectId}_${resourceId}_${issueType.id}`,
  external_source: E_IMPORTER_KEYS.JIRA,
});

export const transformIssueFields = (resourceId: string, projectId: string, issueField: JiraIssueField): Partial<ExIssueProperty> | undefined => {
  if (
    !issueField.schema ||
    !issueField.schema.custom ||
    !issueField.scope?.type ||
    !SUPPORTED_CUSTOM_FIELD_ATTRIBUTES[issueField.schema.custom as JiraCustomFieldKeys]
  ) {
    return undefined;
  }

  return {
    external_id: `${projectId}_${resourceId}_${issueField.id}`,
    external_source: E_IMPORTER_KEYS.JIRA,
    display_name: issueField.name,
    type_id: issueField.scope?.type,
    is_required: false,
    is_active: true,
    ...getPropertyAttributes(issueField),
  };
};

export const transformIssueFieldOptions = (
  resourceId: string,
  projectId: string,
  issueFieldOption: JiraIssueFieldOptions
): Partial<ExIssuePropertyOption> => ({
  external_id: `${projectId}_${resourceId}_${issueFieldOption.id}`,
  external_source: E_IMPORTER_KEYS.JIRA,
  name: issueFieldOption.value,
  is_active: issueFieldOption.disabled ? false : true,
  property_id: `${projectId}_${resourceId}_${issueFieldOption.fieldId}`,
});

export const transformIssuePropertyValues = (
  issue: IJiraIssue,
  // eslint-disable-next-line no-undef
  planeIssueProperties: Map<string, Partial<ExIssueProperty>>,
  // eslint-disable-next-line no-undef
  jiraCustomFieldMap: Map<string, string>
): TPropertyValuesPayload => {
  // Get all custom fields that are present in the issue and are also present in the plane issue properties
  const customFieldKeysToTransform = Object.keys(issue.fields).filter(
    (key) => key.startsWith("customfield_") && planeIssueProperties.has(key)
  );
  // Get transformed values for property_id -> property_values
  const propertyValuesPayload: TPropertyValuesPayload = {};
  customFieldKeysToTransform.forEach((key) => {
    const property = planeIssueProperties.get(key);
    if (property && property.external_id && jiraCustomFieldMap.has(key)) {
      propertyValuesPayload[property.external_id] = getPropertyValues(
        jiraCustomFieldMap.get(key) as JiraCustomFieldKeys,
        issue.fields[key],
        (issue.renderedFields as any)?.[key]
      );
    }
  });
  return propertyValuesPayload;
};
