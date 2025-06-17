import { ParsedIssueData, ParsedLinkWorkItemData } from "../types/types";

export const parseIssueFormData = (values: any): ParsedIssueData => {
  const parsed: ParsedIssueData = {
    title: "",
    project: "",
  };

  // Loop through all blocks
  Object.entries(values).forEach(([_, blockData]: [string, any]) => {
    // Check for project
    if (blockData.project?.type === "static_select") {
      parsed.project = blockData.project.selected_option?.value;
    }

    // Check for title
    if (blockData.issue_title?.type === "plain_text_input") {
      parsed.title = blockData.issue_title.value;
    }

    // Check for description
    if (blockData.issue_description?.type === "plain_text_input") {
      parsed.description = blockData.issue_description.value;
    }

    // Check for state
    if (blockData.issue_state?.type === "static_select") {
      parsed.state = blockData.issue_state.selected_option?.value;
    }

    // Check for priority
    if (blockData.issue_priority?.type === "static_select") {
      parsed.priority = blockData.issue_priority.selected_option?.value;
    }

    // Check for labels
    if (blockData.issue_labels?.type === "multi_static_select") {
      parsed.labels = blockData.issue_labels.selected_options?.map((option: any) => option.value);
    }

    if (blockData.enable_thread_sync?.type === "checkboxes") {
      parsed.enableThreadSync = false;
      if (blockData.enable_thread_sync.selected_options.length > 0) {
        parsed.enableThreadSync = blockData.enable_thread_sync.selected_options[0].value === "true";
      }
    }
  });

  return parsed;
};

export const parseLinkWorkItemFormData = (values: any): ParsedLinkWorkItemData | undefined => {
  let parsed: ParsedLinkWorkItemData | undefined = undefined

  Object.entries(values).forEach(([_, blockData]: [string, any]) => {
    if (blockData.link_work_item?.type === "external_select") {
      const identifer = blockData?.link_work_item?.selected_option?.value;

      if (!identifer) {
        return;
      }

      const parts = identifer.split(":");
      if (parts.length === 3) {
        parsed = {
          workspaceSlug: parts[0],
          projectId: parts[1],
          issueId: parts[2],
        };
      }
    }
  });

  return parsed;
};
