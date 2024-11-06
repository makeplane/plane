export type IMentionSuggestion = {
  id: string;
  type: string;
  entity_name: string;
  entity_identifier: string;
  avatar: string;
  title: string;
  subtitle: string;
  redirect_uri: string;
};

export type IMentionHighlight = string;
