import { type Command, type Transaction } from "@tiptap/pm/state";

export function patchCommand(patch: (tr: Transaction) => Transaction) {
  const withPatch = (command: Command): Command => {
    const patchedCommand: Command = (state, dispatch, view) =>
      command(state, dispatch ? (tr: Transaction) => dispatch(patch(tr)) : undefined, view);

    return patchedCommand;
  };
  return withPatch;
}
