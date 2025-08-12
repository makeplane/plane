export enum EFeedback {
  POSITIVE = "positive",
  NEGATIVE = "negative",
}

export enum EChatType {
  THREAD = "threads",
}

export enum ESource {
  WEB = "web",
}

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
  feedback: EFeedback;
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

export type TDialogue = {
  query: string;
  answer?: string;
  llm?: string;
  feedback?: EFeedback;
  reasoning?: string;
};

export type TChatHistory = {
  chat_id: string;
  dialogue: TDialogue[];
  title: string;
  last_modified: string;
  is_favorite: boolean;
  is_focus_enabled: boolean;
  focus_workspace_id: string;
  focus_project_id: string;
  workspace_id?: string;
};

export type TUserThreads = {
  chat_id: string;
  title: string;
  last_modified: string;
  is_favorite: boolean;
  workspace_id?: string;
};

export type TAiModels = {
  id: string;
  name: string;
  description: string;
  type: string;
  is_default: boolean;
};

interface IItem {
  id: string;
  label: string;
  entity_name: string;
  entity_identifier: string;
  target: string;
  redirect_uri: string;
  name?: string;
  project__identifier?: string;
  sequence_id?: string;
  title: string;
  subTitle: string | undefined;
  type_id: string;
  project_id: string;
}

export interface IFormattedValue {
  [key: string]: Partial<IItem>[] | undefined;
}
