import { PlainTextElement } from "@slack/types";
import { ACTIONS } from "../helpers/constants";
import { extractRichTextElements } from "../helpers/parse-issue-form";
import { PlainTextOption } from "../helpers/slack-options";
import { E_MESSAGE_ACTION_TYPES } from "../types/types";
import {
  CheckboxInputBlock,
  MultiExternalSelectInputBlock,
  PlainTextInputBlock,
  RichTextInputBlock,
  StaticSelectInputBlock,
} from "./custom-blocks";

export type IssueModalViewFull = {
  type: "modal";
  callback_id: string;
  private_metadata: string;
  title: PlainTextElement;
  submit: PlainTextElement;
  close: PlainTextElement;
  blocks: IssueModalViewBlocks;
};

export type IssueModalViewBlocks = (
  | StaticSelectInputBlock
  | PlainTextInputBlock
  | RichTextInputBlock
  | MultiExternalSelectInputBlock
  | CheckboxInputBlock
)[];

export const createIssueModalViewFull = (
  {
    selectedProject,
    projectOptions,
    stateOptions,
    priorityOptions,
  }: {
    selectedProject: PlainTextOption;
    projectOptions: Array<PlainTextOption>;
    stateOptions: Array<PlainTextOption>;
    priorityOptions: Array<PlainTextOption>;
  },
  title?: string,
  privateMetadata: string = "{}",
  showThreadSync: boolean = true,
  isWorkItem: boolean = true,
  messageBlocks?: any[] // Add optional messageBlocks parameter
): IssueModalViewFull => ({
  type: "modal",
  callback_id: isWorkItem ? E_MESSAGE_ACTION_TYPES.CREATE_NEW_WORK_ITEM : E_MESSAGE_ACTION_TYPES.CREATE_INTAKE_ISSUE,
  private_metadata: privateMetadata,
  title: {
    type: "plain_text",
    text: isWorkItem ? "Create Work Item" : "Create Intake Issue",
    emoji: true,
  },
  submit: {
    type: "plain_text",
    text: isWorkItem ? "Create Work Item" : "Create Intake Issue",
    emoji: true,
  },
  close: {
    type: "plain_text",
    text: "Discard",
    emoji: true,
  },
  blocks: [
    // For intake issues (non-work items), only show title, description, and priority
    {
      dispatch_action: true,
      type: "input" as const,
      element: {
        type: "static_select" as const,
        placeholder: {
          type: "plain_text" as const,
          text: "Select a Project",
          emoji: true,
        },
        initial_option: selectedProject,
        options: projectOptions,
        action_id: ACTIONS.PROJECT,
      },
      label: {
        type: "plain_text" as const,
        text: "Project",
        emoji: true,
      },
    },
    {
      type: "input" as const,
      element: {
        type: "plain_text_input" as const,
        placeholder: {
          type: "plain_text" as const,
          text: "Issue Title",
        },
        action_id: ACTIONS.ISSUE_TITLE,
      },
      label: {
        type: "plain_text" as const,
        text: "Title",
        emoji: true,
      },
    },
    {
      type: "input" as const,
      optional: true,
      element: {
        type: "rich_text_input" as const,
        action_id: ACTIONS.ISSUE_DESCRIPTION,
        initial_value: {
          type: "rich_text" as const,
          elements: extractRichTextElements(title, messageBlocks),
        },
        placeholder: {
          type: "plain_text" as const,
          text: "Issue Description (Optional)",
        },
      },
      label: {
        type: "plain_text" as const,
        text: "Description",
        emoji: true,
      },
    },
    ...(isWorkItem
      ? [
          {
            type: "input" as const,
            optional: true,
            element: {
              type: "static_select" as const,
              placeholder: {
                type: "plain_text" as const,
                text: "Select a State",
                emoji: true,
              },
              options: stateOptions,
              action_id: ACTIONS.ISSUE_STATE,
            },
            label: {
              type: "plain_text" as const,
              text: "State",
              emoji: true,
            },
          },
        ]
      : []),
    {
      type: "input" as const,
      optional: true,
      element: {
        type: "static_select" as const,
        placeholder: {
          type: "plain_text" as const,
          text: "Select a Priority (Optional)",
          emoji: true,
        },
        options: priorityOptions,
        action_id: ACTIONS.ISSUE_PRIORITY,
      },
      label: {
        type: "plain_text" as const,
        text: "Priority",
        emoji: true,
      },
    },
    ...(isWorkItem
      ? [
          {
            type: "input" as const,
            optional: true,
            element: {
              type: "multi_external_select" as const,
              placeholder: {
                type: "plain_text" as const,
                text: "Labels (Optional)",
                emoji: true,
              },
              min_query_length: 3,
              action_id: ACTIONS.ISSUE_LABELS,
              initial_options: [],
            },
            label: {
              type: "plain_text" as const,
              text: "Labels",
              emoji: true,
            },
          },
        ]
      : []),
    ...(showThreadSync && isWorkItem
      ? [
          {
            type: "input" as const,
            optional: true,
            element: {
              type: "checkboxes" as const,
              options: [
                {
                  text: {
                    type: "plain_text",
                    text: "Sync slack comments with plane comments and vice versa",
                    emoji: true,
                  } as PlainTextElement,
                  value: "true",
                },
              ],
              action_id: "enable_thread_sync",
            },
            label: {
              type: "plain_text" as const,
              text: "Thread Sync",
              emoji: true,
            },
          },
        ]
      : []),
  ],
});
