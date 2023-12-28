import { PlainTextOption } from "./create-issue-modal";

function extractFromActionId(
  stateValues: Record<string, any>,
  actionId: string,
) {
  for (const blockId in stateValues) {
    const block = stateValues[blockId];
    if (block[actionId]) {
      return block[actionId];
    }
  }
  return null;
}

export function parseCreateIssueModalSubmission(
  stateValues: Record<string, any>,
) {
  const projectAction = extractFromActionId(
    stateValues,
    "project-select-action",
  );
  const issueTitleAction = extractFromActionId(stateValues, "sl_input");
  const issueDescriptionAction = extractFromActionId(stateValues, "ml_input");
  const assigneesAction = extractFromActionId(
    stateValues,
    "multi_static_select-action",
  );
  const stateAction = extractFromActionId(stateValues, "state-select-action");
  const priorityAction = extractFromActionId(
    stateValues,
    "priority-select-action",
  );

  return {
    project:
      projectAction && projectAction.selected_option
        ? {
            id: projectAction.selected_option.value,
            name: projectAction.selected_option.text.text,
          }
        : null,
    issueTitle:
      issueTitleAction && issueTitleAction.value ? issueTitleAction.value : "",
    issueDescription:
      issueDescriptionAction && issueDescriptionAction.value
        ? issueDescriptionAction.value
        : "",
    assignees:
      assigneesAction && assigneesAction.selected_options
        ? assigneesAction.selected_options.map((option: PlainTextOption) => ({
            id: option.value,
            name: option.text.text,
          }))
        : [],
    state:
      stateAction && stateAction.selected_option
        ? {
            id: stateAction.selected_option.value,
            name: stateAction.selected_option.text.text,
          }
        : null,
    priority:
      priorityAction && priorityAction.selected_option
        ? priorityAction.selected_option.value
        : "none",
  };
}
