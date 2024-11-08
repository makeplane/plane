export enum EFeedback {
  POSITIVE = "positive",
  NEGATIVE = "negative",
}

export enum EChatType {
  THREAD = "threads",
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
};

export type TSearchQuery = {
  query: string;
  user_id: string;
};

export type TFeedback = {
  chat_id: string;
  feedback: EFeedback;
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
  feedback?: string;
};

export type TChatHistory = {
  chat_id: string;
  dialogue: TDialogue[];
  title: string;
};

export type TUserThreads = {
  chat_id: string;
  dialogue: string[];
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
