import { useCallback, useMemo, useRef } from "react";
import { CommandAction, CommandGroupMap, groupCommands, isSequencePrefix, matchSequence } from "./registry";

export const useCommandRegistry = (commands: CommandAction[]) => {
  const sequenceRef = useRef<string[]>([]);

  const groups: CommandGroupMap = useMemo(() => groupCommands(commands), [commands]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): boolean => {
      const key = e.key.toLowerCase();
      sequenceRef.current.push(key);

      const current = sequenceRef.current;
      const match = commands.find(
        (cmd) => matchSequence(cmd.keys, current) && (cmd.enabled ? cmd.enabled() : true)
      );

      if (match) {
        e.preventDefault();
        match.run();
        sequenceRef.current = [];
        return true;
      }

      const hasPrefix = commands.some((cmd) => isSequencePrefix(cmd.keys, current));
      if (!hasPrefix) sequenceRef.current = [];
      return false;
    },
    [commands]
  );

  return { groups, handleKeyDown };
};
