import { Flatfile } from "@flatfile/api";
import { IState } from "@plane/types";

interface StateOption {
  label: string;
  value: string;
  color: string;
}

export const getWorkbookConfig = (
  states: (IState | undefined)[]
): Pick<Flatfile.CreateWorkbookConfig, "name" | "labels" | "sheets" | "actions"> => {
  // Convert states to Flatfile enum options format
  const stateOptions: StateOption[] = states
    .map((state) => {
      if (state) {
        return {
          label: state.name,
          value: state.id,
          color: state.color,
        };
      }
    })
    .filter((state): state is StateOption => state !== undefined);

  return {
    name: "All Data",
    labels: ["pinned"],
    sheets: [
      {
        name: "Data Import",
        slug: "plane_issues",
        fields: [
          {
            key: "title",
            label: "Title",
            description: "Issue title",
            type: "string",
            constraints: [{ type: "required" }],
          },
          {
            key: "description",
            label: "Description",
            description: "Issue description",
            type: "string",
          },
          {
            key: "issue_type",
            label: "Issue Type",
            description: "Type of issue (e.g., Bug, Feature, Task)",
            type: "string",
          },
          {
            key: "state",
            label: "State",
            description: "Issue state",
            type: "enum",
            config: {
              allowCustom: false,
              options: stateOptions,
            },
          },
          {
            key: "priority",
            label: "Priority",
            description: "Issue priority",
            type: "enum",
            config: {
              allowCustom: false,
              options: [
                {
                  label: "Urgent",
                  value: "urgent",
                  color: "#FF0000",
                },
                {
                  label: "High",
                  value: "high",
                  color: "#FFA500",
                },
                {
                  label: "Medium",
                  value: "medium",
                  color: "#FFFF00",
                },
                {
                  label: "Low",
                  value: "low",
                  color: "#ADD8E6",
                },
                {
                  label: "None",
                  value: "none",
                  color: "#808080",
                },
              ],
            },
          },
          {
            key: "assignees",
            label: "Assignees",
            description: "Emails of the assignee",
            type: "string-list",
          },
          {
            key: "created_by",
            label: "Created By",
            description: "Email of the creator",
            type: "string",
          },
          {
            key: "start_date",
            label: "Start Date",
            description: "Start date (YYYY-MM-DD)",
            type: "string",
          },
          {
            key: "target_date",
            label: "Target Date",
            description: "Target date (YYYY-MM-DD)",
            type: "string",
          },
          {
            key: "labels",
            label: "Labels",
            description: "Comma-separated list of labels",
            type: "string-list",
          },
          {
            key: "cycle",
            label: "Cycle",
            description: "Cycle Name",
            type: "string",
          },
          {
            key: "module",
            label: "Module",
            description: "Module Name",
            type: "string",
          },
        ],
      },
    ],
    actions: [
      {
        operation: "submitAction",
        mode: "foreground",
        label: "Submit",
        description: "Submit data to webhook.site",
        primary: true,
      },
    ],
  };
};
