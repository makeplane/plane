import { PlainTextElement } from "@slack/types";
import { ACTIONS, E_ISSUE_OBJECT_TYPE_SELECTION } from "../helpers/constants";
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
  | StaticSelectInputBlock
  | PlainTextInputBlock
  | RichTextInputBlock
  | MultiExternalSelectInputBlock
  | CheckboxInputBlock
)[];

export type TIssueModalViewProps = {
  options: {
    selectedProject: PlainTextOption;
    projectOptions: Array<PlainTextOption>;
  };
  config: {
    showIntakeDropdown: boolean;
    threadSync?: {
      showThreadSync: boolean;
      threadSyncEnabled: boolean;
    };
    issueType?: {
      showIssueTypeDropdown: boolean;
      issueTypeOptions: Array<PlainTextOption>;
      selectedIssueType?: PlainTextOption;
    };
  };
  slackBlocks: any[];
  privateMetadata: string;
  isWorkItem: boolean;
  isUpdate?: boolean;
};

export const createIssueModalViewFull = (props: TIssueModalViewProps): IssueModalViewFull => {
  const { options, privateMetadata, config, isWorkItem, slackBlocks, isUpdate } = props;
  const { selectedProject, projectOptions } = options;
  const { showIntakeDropdown, threadSync } = config;
  const { showThreadSync, threadSyncEnabled } = threadSync ?? { showThreadSync: false, threadSyncEnabled: false };

  const createOrUpdate = isUpdate ? "Update" : "Create";

  return {
    type: "modal",
    callback_id: isWorkItem ? E_MESSAGE_ACTION_TYPES.CREATE_NEW_WORK_ITEM : E_MESSAGE_ACTION_TYPES.CREATE_INTAKE_ISSUE,
    private_metadata: privateMetadata,
    title: {
      type: "plain_text",
      text: `${createOrUpdate} ${isWorkItem ? "work item" : "intake work item"}`,
      emoji: true,
    },
    submit: {
      type: "plain_text",
      text: createOrUpdate,
      emoji: true,
    },
    close: {
      type: "plain_text",
      text: "Discard",
      emoji: true,
    },
    blocks: [
      // For intake issues (non-work items), only show title, description, and priority
      ...(!isUpdate
        ? [
            {
              dispatch_action: true,
              type: "input" as const,
              element: {
                type: "static_select" as const,
                placeholder: {
                  type: "plain_text" as const,
                  text: "Choose Project",
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
          ]
        : []),
      ...(showIntakeDropdown && !isUpdate
        ? [
            {
              dispatch_action: true,
              type: "input" as const,
              element: {
                type: "static_select" as const,
                placeholder: {
                  type: "plain_text" as const,
                  text: "Work Item or Intake",
                  emoji: true,
                },
                initial_option: isWorkItem
                  ? {
                      text: {
                        type: "plain_text" as const,
                        text: "Work Item",
                        emoji: true,
                      },
                      value: `${selectedProject.value}.${E_ISSUE_OBJECT_TYPE_SELECTION.WORK_ITEM}`,
                    }
                  : {
                      text: {
                        type: "plain_text" as const,
                        text: "Intake",
                        emoji: true,
                      },
                      value: `${selectedProject.value}.${E_ISSUE_OBJECT_TYPE_SELECTION.INTAKE}`,
                    },
                options: [
                  {
                    text: {
                      type: "plain_text" as const,
                      text: "Work Item",
                      emoji: true,
                    },
                    value: `${selectedProject.value}.${E_ISSUE_OBJECT_TYPE_SELECTION.WORK_ITEM}`,
                  },
                  {
                    text: {
                      type: "plain_text" as const,
                      text: "Intake",
                      emoji: true,
                    },
                    value: `${selectedProject.value}.${E_ISSUE_OBJECT_TYPE_SELECTION.INTAKE}`,
                  },
                ],
                action_id: ACTIONS.ISSUE_OBJECT_TYPE_SELECTION,
              },
              label: {
                type: "plain_text" as const,
                text: "Add as",
                emoji: true,
              },
            },
          ]
        : []),
      ...(config.issueType?.showIssueTypeDropdown && !isUpdate
        ? [
            {
              type: "input" as const,
              dispatch_action: true,
              element: {
                type: "static_select" as const,
                placeholder: {
                  type: "plain_text" as const,
                  text: "Select an Issue Type",
                  emoji: true,
                },
                initial_option: config.issueType.selectedIssueType,
                options: config.issueType.issueTypeOptions,
                action_id: ACTIONS.ISSUE_TYPE,
              },
              label: {
                type: "plain_text" as const,
                text: "Issue Type",
                emoji: true,
              },
            },
          ]
        : []),
      ...slackBlocks,
      ...(showThreadSync && isWorkItem && !isUpdate
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
                initial_options: threadSyncEnabled
                  ? [
                      {
                        text: {
                          type: "plain_text",
                          text: "Sync slack comments with plane comments and vice versa",
                          emoji: true,
                        } as PlainTextElement,
                        value: "true",
                      },
                    ]
                  : undefined,
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
  };
};
