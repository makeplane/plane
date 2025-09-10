"use client";

import { useRef } from "react";

export const useKeySequence = (
  handlers: Record<string, () => void>,
  timeout = 500
) => {
  const sequence = useRef("");
  const sequenceTimeout = useRef<NodeJS.Timeout | null>(null);

  return (e: React.KeyboardEvent) => {
    const key = e.key.toLowerCase();
    sequence.current = (sequence.current + key).slice(-2);

    if (sequenceTimeout.current) clearTimeout(sequenceTimeout.current);
    sequenceTimeout.current = setTimeout(() => {
      sequence.current = "";
    }, timeout);

    const action = handlers[sequence.current];
    if (action) {
      e.preventDefault();
      action();
      sequence.current = "";
    }
  };
};

