export enum AI_EDITOR_TASKS {
  ASK_ANYTHING = "ASK_ANYTHING",
}

export const LOADING_TEXTS: {
  [key in AI_EDITOR_TASKS]: string;
} = {
  [AI_EDITOR_TASKS.ASK_ANYTHING]: "Pi is generating response",
};
