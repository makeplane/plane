import { ACTIONS } from "../helpers/constants";
import { PlainTextOption } from "../helpers/slack-options";
import { PlainTextElement } from "@slack/types";
import {
  CheckboxInputBlock,
  MultiExternalSelectInputBlock,
  PlainTextInputBlock,
  StaticSelectInputBlock,
} from "./custom-blocks";
import { E_MESSAGE_ACTION_TYPES } from "../types/types";

export type IssueModalViewFull = {
  type: "modal";
  callback_id: string;
  private_metadata: string;
  title: PlainTextElement;
  submit: PlainTextElement;
  close: PlainTextElement;
  blocks: IssueModalViewBlocks;
};

export type IssueModalViewBlocks = [
  StaticSelectInputBlock,
  PlainTextInputBlock,
  PlainTextInputBlock,
  StaticSelectInputBlock,
  StaticSelectInputBlock,
  MultiExternalSelectInputBlock,
  ...(CheckboxInputBlock | undefined)[],
];

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
  showThreadSync: boolean = true
): IssueModalViewFull => ({
  type: "modal",
  callback_id: E_MESSAGE_ACTION_TYPES.CREATE_NEW_WORK_ITEM,
  private_metadata: privateMetadata,
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
  // @ts-ignore
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
        initial_option: selectedProject,
        options: projectOptions,
        action_id: ACTIONS.PROJECT,
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
        placeholder: {
          type: "plain_text",
          text: "Issue Title",
        },
        action_id: ACTIONS.ISSUE_TITLE,
      },
      label: {
        type: "plain_text",
        text: "Title",
        emoji: true,
      },
    },
    {
      type: "input",
      optional: true,
      element: {
        type: "plain_text_input",
        action_id: ACTIONS.ISSUE_DESCRIPTION,
        multiline: true,
        initial_value: title ?? "",
        placeholder: {
          type: "plain_text",
          text: "Issue Description (Optional)",
        },
      },
      label: {
        type: "plain_text",
        text: "Description",
        emoji: true,
      },
    },
    {
      type: "input",
      optional: true,
      element: {
        type: "static_select",
        placeholder: {
          type: "plain_text",
          text: "Select a State",
          emoji: true,
        },
        options: stateOptions,
        action_id: ACTIONS.ISSUE_STATE,
      },
      label: {
        type: "plain_text",
        text: "State",
        emoji: true,
      },
    },
    {
      type: "input",
      optional: true,
      element: {
        type: "static_select",
        placeholder: {
          type: "plain_text",
          text: "Select a Priority (Optional)",
          emoji: true,
        },
        options: priorityOptions,
        action_id: ACTIONS.ISSUE_PRIORITY,
      },
      label: {
        type: "plain_text",
        text: "Priority",
        emoji: true,
      },
    },
    {
      type: "input",
      optional: true,
      element: {
        type: "multi_external_select",
        placeholder: {
          type: "plain_text",
          text: "Labels (Optional)",
          emoji: true,
        },
        min_query_length: 3,
        action_id: ACTIONS.ISSUE_LABELS,
        initial_options: [],
      },
      label: {
        type: "plain_text",
        text: "Labels",
        emoji: true,
      },
    },
    ...(showThreadSync
      ? [
        {
          type: "input",
          optional: true,
          element: {
            type: "checkboxes",
            options: [
              {
                text: {
                  type: "plain_text",
                  text: "Sync slack comments with plane comments and vice versa",
                  emoji: true,
                },
                value: "true",
              },
            ],
            action_id: "enable_thread_sync",
          },
          label: {
            type: "plain_text",
            text: "Thread Sync",
            emoji: true,
          },
        },
      ]
      : []),
  ],
});
