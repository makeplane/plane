import { type } from "os";

export const CreateIssueModalViewFull = {
  type: "modal",
  title: {
    type: "plain_text",
    text: "Create Issue",
    emoji: true,
  },
  submit: {
    type: "plain_text",
    text: "Create Issue",
    emoji: true,
  },
  close: {
    type: "plain_text",
    text: "Discard Issue",
    emoji: true,
  },
  blocks: [
    {
      dispatch_action: true,
      type: "input",
      element: {
        type: "static_select",
        placeholder: {
          type: "plain_text",
          text: "Select a Project",
          emoji: true,
        },
        options: [
          {
            text: {
              type: "plain_text",
              text: "*this is plain_text text*",
              emoji: true,
            },
            value: "value-0",
          },
          {
            text: {
              type: "plain_text",
              text: "*this is plain_text text*",
              emoji: true,
            },
            value: "value-1",
          },
          {
            text: {
              type: "plain_text",
              text: "*this is plain_text text*",
              emoji: true,
            },
            value: "value-2",
          },
        ],
        action_id: "project-select-action",
      },
      label: {
        type: "plain_text",
        text: "Project",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "plain_text_input",
        action_id: "sl_input",
        placeholder: {
          type: "plain_text",
          text: "Issue Title",
        },
      },
      label: {
        type: "plain_text",
        text: "Title",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "plain_text_input",
        action_id: "ml_input",
        multiline: true,
        placeholder: {
          type: "plain_text",
          text: "Issue Description (Optional)",
        },
      },
      label: {
        type: "plain_text",
        text: "Description",
      },
    },
    {
      type: "input",
      element: {
        type: "static_select",
        placeholder: {
          type: "plain_text",
          text: "Select a State",
          emoji: true,
        },
        options: [
          {
            text: {
              type: "plain_text",
              text: "`Select Project`",
              emoji: true,
            },
            value: "select-project",
          },
        ],
        action_id: "state-select-action",
      },
      label: {
        type: "plain_text",
        text: "State",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "static_select",
        placeholder: {
          type: "plain_text",
          text: "Select a Priority",
          emoji: true,
        },
        options: [
          {
            text: {
              type: "plain_text",
              text: "`Select Project`",
              emoji: true,
            },
            value: "select-project",
          },
        ],
        action_id: "priority-select-action",
      },
      label: {
        type: "plain_text",
        text: "Priority",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "multi_static_select",
        placeholder: {
          type: "plain_text",
          text: "Labels (Optional)",
          emoji: true,
        },
        options: [
          {
            text: {
              type: "plain_text",
              text: "`Select Project`",
              emoji: true,
            },
            value: "select-project",
          },
        ],
        action_id: "multi_static_select-action",
      },
      label: {
        type: "plain_text",
        text: "Labels",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "multi_static_select",
        placeholder: {
          type: "plain_text",
          text: "Assignees (Optional)",
          emoji: true,
        },
        options: [
          {
            text: {
              type: "plain_text",
              text: "`Select Project`",
              emoji: true,
            },
            value: "select-project",
          },
        ],
        action_id: "multi_static_select-action",
      },
      label: {
        type: "plain_text",
        text: "Assignees",
        emoji: true,
      },
    },
  ],
};

export type PlainTextOption = {
  text: {
    type: "plain_text";
    text: string;
    emoji: true;
  };
  value: string;
};

export const CreateIssueModalViewProjects = (
  projects: Array<PlainTextOption>,
) => ({
  type: "modal",
  title: {
    type: "plain_text",
    text: "Create Issue",
    emoji: true,
  },
  submit: {
    type: "plain_text",
    text: "Create Issue",
    emoji: true,
  },
  close: {
    type: "plain_text",
    text: "Discard Issue",
    emoji: true,
  },
  blocks: [
    {
      dispatch_action: true,
      type: "input",
      element: {
        type: "static_select",
        placeholder: {
          type: "plain_text",
          text: "Select a Project",
          emoji: true,
        },
        options: projects,
        action_id: "project-select-action",
      },
      label: {
        type: "plain_text",
        text: "Project",
        emoji: true,
      },
    },
  ],
});
