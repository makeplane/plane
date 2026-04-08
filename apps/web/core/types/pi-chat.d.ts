import type { TIssue, TLogoProps, TProject, TFileSignedURLResponse, TPage, EAiFeedback } from "@plane/types";

export enum EChatType {
  THREAD = "threads",
}

export enum ESource {
  WEB = "web",
}

export type TEntity = {
  entity_type: string | undefined;
  entity_url: string | undefined;
  entity_name: string | undefined;
  entity_id: string | undefined;
};

export type TQuery = {
  query: string;
  is_new: boolean;
  chat_id: string;
  is_temp: boolean;
  workspace_in_context: boolean;
  workspace_id?: string;
  project_id?: string;
  llm?: string;
  source: string;
  context?: {
    [key: string]: string;
  };
  is_project_chat?: boolean;
  workspace_slug?: string;
  pi_sidebar_open?: boolean;
  sidebar_open_url?: string;
  attachment_ids?: string[];
  mode?: string;
  is_websearch_enabled?: boolean;
};
export type TInitPayload = Pick<
  TQuery,
  "workspace_in_context" | "workspace_id" | "project_id" | "is_project_chat" | "workspace_slug"
>;
export type TSearchQuery = {
  query: string;
};

export type TFeedback = {
  chat_id: string;
  message_index: number;
  feedback: EAiFeedback;
  feedback_message?: string;
  workspace_id?: string;
};

export type TFocus = {
  isInWorkspaceContext: boolean;
  entityType: string;
  entityIdentifier: string;
};

export type TTemplate = {
  text: string;
  id: string[];
  type;
};
export enum EExecutionStatus {
  PENDING = "pending",
  EXECUTING = "executing",
  COMPLETED = "completed",
}
export type TActions = {
  actions_count: number;
  message?: string;
  status?: EExecutionStatus;
  actions?: {
    entity: TEntity;
  }[];
};

export type TUpdatedArtifact = Partial<TIssue> | Partial<TProject> | Partial<TPage> | TArtifact | undefined;

export type TArtifact = {
  artifact_id: string;
  is_editable: boolean;
  is_executed: boolean;
  success: boolean;
  error?: string;
  message?: string;
  artifact_type: string;
  entity_id?: string;
  entity_url?: string;
  entity_name?: string;
  issue_identifier?: string;
  project_identifier?: string;
  tool_name: string;
  parameters: {
    name: string;
    color?: {
      name: string;
    };
    logo_props?: TLogoProps;
    description?: string;
    description_html?: string;
    properties: {
      [key: string]: any;
    };
    project?: {
      id: string;
      name: string;
      identifier?: string;
    };
    artifact_sub_type?: string;
  };
  message_id: string;
  action: string;
  success?: boolean;
};

export type TArtifactWithEntity = TArtifact & {
  entity?: {
    entity_id: string;
    entity_url: string;
    issue_identifier: string;
    entity_name: string;
  };
};

export type TTodoItem = {
  content: string;
  status: "pending" | "in_progress" | "completed";
};

export type TDialogue = {
  query_id?: string;
  answer_id?: string;
  query: string;
  answer?: string;
  llm?: string;
  feedback?: EAiFeedback;
  current_tick?: string;
  reasoning?: string;
  todos?: TTodoItem[];
  isPiThinking: boolean;
  execution_status?: EExecutionStatus;
  actions?: TArtifactWithEntity[];
  action_summary?: {
    completed: number;
    duration_seconds: number;
    failed: number;
    total_planned: number;
  };
  attachment_ids?: string[];
  action_error?: string;
};

export type TChatHistory = {
  chat_id: string;
  dialogue: string[];
  dialogueMap: Record<string, TDialogue>;
  title: string;
  last_modified: string;
  is_favorite: boolean;
  is_focus_enabled: boolean;
  is_websearch_enabled: boolean;
  focus_workspace_id: string;
  focus_project_id: string;
  workspace_id?: string;
  mode?: string;
  llm?: string;
};

export type TAction = {
  workspace_id: string;
  chat_id: string;
  message_id: string;
  artifact_data: {
    artifact_id: string;
    is_edited: boolean;
    action_data?: TUpdatedArtifact;
  }[];
};

export type TExecuteActionResponse = {
  status: string;
  message: string;
  actions: TArtifactWithEntity[];
  action_summary?: {
    completed: number;
    duration_seconds: number;
    failed: number;
    total_planned: number;
  };
};

export type TUserThreads = {
  chat_id: string;
  title: string;
  last_modified: string;
  is_favorite: boolean;
  workspace_id?: string;
  llm?: string;
};

export type TAiModels = {
  id: string;
  name: string;
  description: string;
  type: string;
  is_default: boolean;
  /** False for custom/self-hosted models that cannot use web search. Omitted or true for vendor models. */
  supports_web_search?: boolean;
};

export type TPiLoaders = "recording" | "transcribing" | "submitting" | "";

export type TFollowUp = {
  query: string;
  workspace_id: string;
  chat_id: string;
  artifact_id: string;
  current_artifact_data: TUpdatedArtifact;
  user_message_id: string;
  entity_type: string;
  project_id: string;
};

export type TFollowUpResponse = {
  success: boolean;
  artifact_data: TUpdatedArtifact;
};

export type TPiAttachment = {
  attachment_url: string;
  file_size: number;
  file_type: string;
  filename: string;
  id: string;
};

export type TPiAttachmentUploadResponse = TFileSignedURLResponse & {
  attachment_id: string;
  attachment: TPiAttachment;
};
export type TPiAttachmentMap = {
  [chatId: string]: TPiAttachment;
};

export type TPiAttachmentIdMap = {
  [chatId: string]: string[];
};

export type TInstanceResponse =
  | {
      is_authorized: true;
      templates: TTemplate[];
    }
  | {
      is_authorized: false;
      oauth_url: string;
    };

export type TChatContextData = {
  id: string;
  type: string;
  title: string | undefined;
  subTitle?: string | undefined;
} | null;
export type TPiChatDrawerOpen = {
  is_open: boolean;
  chatId?: string;
};

// SSE Event Types
export type TSSEDeltaEvent = {
  chunk: string;
};

export type TSSEReasoningEvent = {
  header?: string;
  content?: string;
};

export type TSSETodosEvent = {
  todos: TTodoItem[];
};

export type TSSEActionsEvent = TArtifact;

export type TSSETitleResponse = {
  title: string;
};

// constants
export const PI_CHAT_ASSISTANT_KEY = "pi_chat_assistant";
export const EDITABLE_ARTIFACT_TYPES = ["workitem", "epic", "page", "project", "cycle", "module"];
