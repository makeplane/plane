export enum AI_EDITOR_TASKS {
  PARAPHRASE = "PARAPHRASE",
  SIMPLIFY = "SIMPLIFY",
  ELABORATE = "ELABORATE",
  SUMMARIZE = "SUMMARIZE",
  GET_TITLE = "GET_TITLE",
  TONE = "TONE",
  ASK_ANYTHING = "ASK_ANYTHING",
}

export const LOADING_TEXTS: {
  [key in AI_EDITOR_TASKS]: string;
} = {
  [AI_EDITOR_TASKS.PARAPHRASE]: "Pi is paraphrasing",
  [AI_EDITOR_TASKS.SIMPLIFY]: "Pi is simplifying",
  [AI_EDITOR_TASKS.ELABORATE]: "Pi is elaborating",
  [AI_EDITOR_TASKS.SUMMARIZE]: "Pi is summarizing",
  [AI_EDITOR_TASKS.GET_TITLE]: "Pi is getting title",
  [AI_EDITOR_TASKS.TONE]: "Pi is adjusting tone",
  [AI_EDITOR_TASKS.ASK_ANYTHING]: "Pi is generating response",
};
