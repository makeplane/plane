"use client";

import { useCallback, useRef } from "react";
import { CommandRegistry } from "../command-registry";
import { CommandExecutionContext } from "../types";

export const useKeySequenceHandler = (
  registry: CommandRegistry,
  executionContext: CommandExecutionContext,
  timeout = 500
) => {
  const sequence = useRef("");
  const sequenceTimeout = useRef<number | null>(null);

  const handleKeySequence = useCallback(
    (e: React.KeyboardEvent) => {
      const key = e.key.toLowerCase();
      sequence.current = (sequence.current + key).slice(-2);

      if (sequenceTimeout.current) window.clearTimeout(sequenceTimeout.current);
      sequenceTimeout.current = window.setTimeout(() => {
        sequence.current = "";
      }, timeout);

      const executed = registry.executeKeySequence(sequence.current, executionContext);
      if (executed) {
        e.preventDefault();
        sequence.current = "";
      }
    },
    [registry, executionContext, timeout]
  );

  return handleKeySequence;
};
