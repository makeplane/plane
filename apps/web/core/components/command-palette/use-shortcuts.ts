import { useCallback, useEffect, useRef } from "react";

export interface Shortcut {
  keys?: string[]; // simultaneous combination
  sequence?: string[]; // sequential keys
  handler: (e: KeyboardEvent) => void;
  enabled?: (e: KeyboardEvent) => boolean;
  preventDefault?: boolean;
}

const matchCombo = (pressed: string[], combo: string[]) => {
  if (pressed.length !== combo.length) return false;
  return combo.every((k) => pressed.includes(k));
};

const matchSequence = (buffer: string[], sequence: string[]) => {
  if (buffer.length < sequence.length) return false;
  const start = buffer.length - sequence.length;
  return sequence.every((k, i) => buffer[start + i] === k);
};

export const useShortcuts = (
  shortcuts: Shortcut[],
  options?: { filter?: (e: KeyboardEvent) => boolean; additional?: (e: KeyboardEvent) => void }
) => {
  const bufferRef = useRef<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  const listener = useCallback(
    (e: KeyboardEvent) => {
      if (options?.filter && !options.filter(e)) return;

      const pressed: string[] = [];
      if (e.metaKey) pressed.push("meta");
      if (e.ctrlKey) pressed.push("control");
      if (e.altKey) pressed.push("alt");
      if (e.shiftKey) pressed.push("shift");
      pressed.push(e.key.toLowerCase());

      bufferRef.current.push(e.key.toLowerCase());
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        bufferRef.current = [];
      }, 1000);

      shortcuts.forEach((s) => {
        if (s.enabled && !s.enabled(e)) return;
        if (s.keys && matchCombo(pressed, s.keys)) {
          if (s.preventDefault ?? true) e.preventDefault();
          s.handler(e);
        } else if (s.sequence && matchSequence(bufferRef.current, s.sequence)) {
          if (s.preventDefault ?? true) e.preventDefault();
          bufferRef.current = [];
          s.handler(e);
        }
      });

      options?.additional?.(e);
    },
    [shortcuts, options]
  );

  useEffect(() => {
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [listener]);
};
