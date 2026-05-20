export const isComposingKeyboardEvent = (event: Pick<KeyboardEvent, "isComposing" | "keyCode">) =>
  event.isComposing || event.keyCode === 229;
