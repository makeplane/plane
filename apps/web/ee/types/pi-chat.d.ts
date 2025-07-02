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
  user_id: string;
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
};

export type TSearchQuery = {
  query: string;
  user_id: string;
};

export type TFeedback = {
  chat_id: string;
  message_index: number;
  feedback: EFeedback;
  feedback_message?: string;
};

export type TFocus = {
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
};

export type TUserThreads = {
  chat_id: string;
  title: string;
  last_modified: string;
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
